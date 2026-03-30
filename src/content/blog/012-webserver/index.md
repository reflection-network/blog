---
title: "012: Agent Gets a Web Server"
description: "Adding nginx to every agent container — the base layer owns the web server, adapters extend it through conf.d, and nginx specificity rules make the whole thing composable."
date: 2026-03-29T12:00:00
featured_image: ./featured.jpg
---

Every Reflection agent now has a web presence. An nginx instance inside the container, a static identity page, and a composable proxy layer that lets adapters expose their runtime services without touching nginx config directly.

## Why a web server

Until now, agents were reachable only through Telegram. That works for chat, but an agent needs more than a chat interface. Health checks, webhooks, a dashboard, REST APIs — these are all HTTP. And there's a simpler reason: if you deploy something, you should be able to open a URL and see that it's alive.

The question wasn't *whether* to add a web server, but *where* it belongs in the architecture.

## nginx in the base layer

Reflection has two layers: agent.nix (the base schema and identity) and adapters (runtime-specific backends). The first instinct was to put nginx in the adapter — after all, each adapter knows what services it needs to expose.

But the static landing page shows the agent's name. That's identity, not runtime. If we put nginx in the adapter, every adapter duplicates the same setup: install nginx, write a config, generate a static page, start the process. The web server is infrastructure that belongs in the base layer.

The split: **nginx itself lives in agent.nix** — the binary, the base config, the static pages. **Proxy rules live in the adapter** — each adapter knows what backend services it runs and how to reach them. The two meet through nginx's `conf.d` directory: agent.nix creates it, the adapter drops its proxy config into it.

agent.nix now generates:

- An nginx config listening on port 8080, with `include /etc/nginx/conf.d/*.conf;` in the server block
- A static `index.html` showing the agent's name
- A `/hello` endpoint that returns the agent's name as plain text
- An empty `/etc/nginx/conf.d/` directory for adapters to populate
- A `web` output that adapters consume

```nix
web = {
  packages = [ pkgs.nginx webRoot nginxConfigDir ];
  startCmd = "${pkgs.nginx}/bin/nginx -c /etc/nginx/nginx.conf";
  port = 8080;
};
```

An adapter includes `web.packages` in its Docker image, calls `web.startCmd` in its entrypoint before starting its own process, and uses `web.port` for `ExposedPorts`. Three lines of integration, zero nginx knowledge. If the adapter needs to expose a backend — it adds a `.conf` file to `conf.d` with its proxy rules.

## Composability through conf.d and specificity

The design question that matters: how do agent.nix and the adapter share the same nginx without stepping on each other?

The answer is two nginx features working together:

**conf.d includes.** The server block has `include /etc/nginx/conf.d/*.conf;`. Adapters drop a `.conf` file into that directory — it gets included at the right scope. The base creates the directory; the adapter populates it.

**Location specificity.** nginx picks the most specific matching location. agent.nix defines exact-match locations like `location = /hello`. The adapter adds a catch-all `location /` via conf.d. The exact match always wins.

This means agent.nix can claim any path it wants — `/hello` today, `/vnc` or `/vscode` tomorrow — and the adapter's catch-all handles everything else. Neither layer needs to know what the other defines.

For adapter-zeroclaw, the conf.d file is four lines:

```nginx
location / {
    proxy_pass http://127.0.0.1:42617;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

This proxies everything to ZeroClaw's gateway — health checks, webhooks, WebSocket chat, REST API, web dashboard, metrics. All through one catch-all, all behind nginx.

adapter-claude doesn't add any conf.d file. Telegram transport is outbound-only — no inbound HTTP. It gets the static page and `/hello` for free.

## The /agent/ prefix that didn't work

We originally wanted a clean URL hierarchy: static page at `/`, runtime services at `/agent/`. The adapter would proxy `/agent/` to the gateway.

This broke immediately. ZeroClaw's web dashboard is a Vite SPA with `base: "/_app/"` hardcoded in the build. The JavaScript makes fetch requests to absolute paths: `/health`, `/admin/paircode`, `/_app/assets/...`. These bypass the `/agent/` proxy and hit nginx root, returning 404s.

We tried adding proxies for each path individually — `/_app/`, `/health`, `/admin/`, `/api/`, `/ws/`, `/webhook`, `/metrics`. At that point the prefix served no purpose. If you have to proxy every path anyway, a catch-all is simpler and more correct.

The lesson: sub-path proxying doesn't work with SPAs that use absolute paths. Unless the SPA supports a configurable base path (this one doesn't), the proxy must sit at the root.

## Public URL without a tunnel

ZeroClaw generates links in Telegram messages — "click here to open the dashboard." For this, it needs to know its public URL. It discovers this through a `[tunnel]` config section designed for tools like Cloudflare Tunnel or ngrok.

We don't have a tunnel. The hostname is known at deploy time — it's an environment variable. So we wrote a shell script that pretends to be one:

```bash
#!/bin/bash
HOST="${AGENT_HOSTNAME:-http://localhost:8080}"
HOST="${HOST%/}"
echo "$HOST"
exec sleep infinity
```

ZeroClaw's custom tunnel provider spawns this, reads the URL from stdout, and uses it as the public address. The `sleep infinity` keeps the "tunnel" alive for ZeroClaw's health checks. The `${HOST%/}` strips trailing slashes — without it, a hostname ending with `/` produces double slashes in generated URLs.

`AGENT_HOSTNAME` lives in the capsule's `.env` file. The tunnel config in ZeroClaw:

```toml
[tunnel]
provider = "custom"

[tunnel.custom]
start_command = "/etc/zeroclaw/tunnel-url.sh"
url_pattern = "http"
```

## Gateway pairing

ZeroClaw's dashboard has a pairing flow: it shows a form asking for a 6-digit code from the container logs. You enter the code, the browser gets a Bearer token, and subsequent requests are authenticated.

The problem: we don't always have console access. The pairing form appears when `/health` returns `"paired": false` — regardless of whether the server requires pairing. The SPA checks `paired`, not `require_pairing`.

For now, `require_pairing = false` in the gateway config. All API requests succeed without authentication. This is acceptable because authentication will be added at the platform level — not per-adapter, not per-agent.

## Bugs worth mentioning

**flake-utils transpose.** `eachDefaultSystem` transposes the output: `base.web.${system}`, not `base.${system}.web`. Both adapters had this wrong. One silently failed (devShells had an `or {}` fallback), the other crashed.

**Nix store permissions.** adapter-zeroclaw copies config.toml from the Nix store to a writable location, then injects secrets via `sed`. Nix store files are 444. On the first run, `cp` creates a read-only copy. On restart, `cp` fails because it can't overwrite. Fix: `install -m 644` — atomically replaces regardless of target permissions.

**Trailing slash in URLs.** `AGENT_HOSTNAME=https://host.example.com/` plus a path produces double slashes. Fixed with `${HOST%/}`.

## The increment

Four repos changed:

**agent.nix** — owns nginx: static page, `/hello` endpoint, conf.d directory, `web` output. Defines what the agent serves as part of its identity.

**adapter-claude** — uses `web.packages` and `web.startCmd`. No proxy config. Gets the web page for free.

**adapter-zeroclaw** — catch-all proxy via conf.d, custom tunnel script, `AGENT_HOSTNAME` env var, `require_pairing = false`, `trust_forwarded_headers = true`, `install -m 644` fix.

**launcher** — `WEB_PORT` for host-to-container port mapping, `CONTAINER_MEMORY` for memory limits.

The web server starts alongside the agent's main process. No extra containers, no sidecars — nginx as a background process, started before the runtime.

## What's next

The static page is a placeholder. Future iterations will generate richer content — capabilities, status, links to the capsule repo. The `/hello` endpoint proves the pattern: agent.nix claims specific paths, the adapter handles everything else.

Authentication is deferred to the platform level. And the launcher needs rework — it should build and run Docker images through a Nix-native interface rather than shelling out to Docker directly.
