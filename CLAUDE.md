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

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All colors, spacing, border radius, typography weights, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
Key reminders from DESIGN.md:
- Dark-first: background #111111, cards #1C1C1C — NOT white or light backgrounds
- Accent/CTA: #E8A030 amber — the only warm color, reserve for primary actions
- Font: DM Sans at all weights
- Gesamtbetrag: 36px bold, tabular-nums, top of detail screen (hero position)
- No emoji icons — render as `?` boxes on simulator; use drawn View components
- No gradients, no purple, no blue primary, no centered layouts for data screens
