# Walter

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

Available skills:
- `/office-hours` — Brainstorm ideas (YC-style forcing questions)
- `/plan-ceo-review` — Strategy/scope review
- `/plan-eng-review` — Architecture and execution plan review
- `/plan-design-review` — Designer's eye plan review
- `/design-consultation` — Create a full design system + DESIGN.md
- `/review` — Pre-landing PR code review
- `/ship` — Ship workflow: merge, test, bump version, create PR
- `/browse` — Headless browser for testing and dogfooding
- `/qa` — QA test and fix bugs iteratively
- `/qa-only` — QA report only, no fixes
- `/design-review` — Visual QA and design polish
- `/setup-browser-cookies` — Import browser cookies for authenticated testing
- `/retro` — Weekly engineering retrospective
- `/investigate` — Systematic debugging with root cause analysis
- `/document-release` — Post-ship documentation update
- `/codex` — OpenAI Codex second opinion / adversarial code review
- `/careful` — Safety guardrails for destructive commands
- `/freeze` — Restrict edits to a specific directory
- `/guard` — Full safety mode (careful + freeze combined)
- `/unfreeze` — Remove freeze restrictions
- `/gstack-upgrade` — Upgrade gstack to the latest version

If gstack skills aren't working, run the following to build the binary and register skills:

```
cd .claude/skills/gstack && ./setup
```
