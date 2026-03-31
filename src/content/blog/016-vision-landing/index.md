---
title: "016: Vision Landing"
description: "Rewriting the landing page as a manifesto — from feature list to product vision."
date: 2026-03-30T22:00:00
featured_image: ./featured.jpg
---

The old landing page listed features. Declarative agents. Git-native. Run anywhere. Three bullets, a code snippet, and a "Get Started" button. It described the mechanism — Nix configs and Git repos — but never explained why any of it mattered.

This iteration replaces it with a vision. Not what Reflection does today, but where it's going and why.

## The problem with feature lists

Iteration [010](/010-vision-roadmap/) articulated the product vision for the first time: a platform for founding and managing AI-native companies. But the landing page still read like a DevOps tool. "Nix config, no SDK lock-in" is true, and nobody outside the Nix community cares.

The disconnect was clear. The vision talks about founders, employees, organizations. The landing page talks about declarative configs and runtime swapping. These are the same thing described at different altitudes. The landing page was stuck at the implementation level when it should have been at the problem level.

## Leading with the problem

The new landing page opens with a provocation: "You don't need a better AI tool. You need an AI team."

This sets the frame immediately. Reflection isn't competing with LangChain or CrewAI on features. It's solving a different problem: you have agents, but you don't have an organization. You have tools, but you don't have a team.

The page then walks through a narrative:

**The churn problem.** Every year a new framework. 2023: Python scripts. 2024: LangChain. 2025: Claude Code. 2026: OpenClaw. Every transition kills your agents because they're coupled to the runtime. This is the pain — the thing that makes people nod and keep reading.

**The insight.** An agent is not code. An agent is an identity — role, personality, capabilities, boundaries. Just like an employee. You don't rewrite employees when you switch from Slack to Teams. The analogy lands because it's obvious once stated.

**The vision.** Describe who you need, not how to build them. You're the founder and the architect. Define roles, structure, values. The platform handles the rest — today with whatever runtime is best, tomorrow with whatever replaces it.

**Self-evolution.** Agents are Git repos. They can modify themselves and each other. The organization evolves within the boundaries you set. Your job: vision, values, constraints.

**Infrastructure ownership.** Your hardware, your data. NixOS, Git, plain text. No vendor lock. Walk away anytime.

**The future.** From containers to robots. Same config. Continuous Assembly — `git push` builds hardware. We don't know what comes after robots, but the architecture doesn't care.

## The manifesto

A separate `/manifesto` page captures the principles as a living document. Ten principles, each a short statement with a paragraph of explanation:

1. Every person is a founder
2. Agents are identities, not implementations
3. The founder's job: vision, values, boundaries
4. Organizations evolve themselves
5. Own your infrastructure
6. Security is a constraint, not a feature
7. Runtimes come and go. Your team stays.
8. From containers to robots
9. We build on the best of what exists
10. We ship what works

The manifesto exists to be updated. As the vision sharpens through building, principles will be added, rewritten, or cut. It's a snapshot of current thinking, not a constitution.

## The image

The featured image shows the evolution of AI agents as a blueprint-style progression — five increasingly complex technical schematics from left to right. A simple rectangular block (a script), interconnected modules (a framework), branching subsystems (an autonomous runtime), a complex architecture (a team), and finally a humanoid figure composed of geometric components. Same drawing style throughout. The message: the endpoint keeps changing, but the blueprint approach stays the same.

This image serves double duty — it's on the landing page between the hero and the first content section, and it's the OpenGraph image for Twitter cards. When someone shares the link, the evolution visual is what people see.

## What changed

The landing page went from a feature list to a narrative. The manifesto gives the vision a permanent, linkable home. OpenGraph meta tags ensure the right image and description appear when the URL is shared. The Twitter bio gets updated to match: "You don't need a better AI tool. You need an AI team."

Sixteen iterations in. The product finally speaks for itself.
