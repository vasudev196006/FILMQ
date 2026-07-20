# Project Brain Instructions for AI Assistants

This repository uses the [project-brain](https://github.com/Ethan-YS/project-brain) methodology for session memory and context continuity across AI sessions.

## Mandatory Startup Protocol

At the start of **every session**, you MUST read the following core brain documents before taking action:

1. **[brain/MAP.md](file:///c:/projects/filmq/FILMQ/brain/MAP.md)** — Project structure, module locations, quick start commands, and entry points.
2. **[brain/STATUS.md](file:///c:/projects/filmq/FILMQ/brain/STATUS.md)** — Current development state, active priorities, next steps, and blockers.
3. **[brain/HANDOFF.md](file:///c:/projects/filmq/FILMQ/brain/HANDOFF.md)** *(if present)* — Handoff context and warm notes from the previous session.

## Key Rules

- **Decisions**: When making significant technical or architectural choices, append an ADR entry to [brain/DECISIONS.md](file:///c:/projects/filmq/FILMQ/brain/DECISIONS.md) including context, decision, rejected alternatives, and consequences.
- **Status Soft Cap**: Keep `STATUS.md` under 80 lines. Overwrite old progress as features reach stability in `MAP.md`.
- **Handoff**: Before concluding a session or switching context, update `HANDOFF.md` with active focus and next immediate steps.
- **Security**: Never hardcode API keys or secrets in frontend source code. Always reference environment variables (e.g. `VITE_TMDB_API_KEY`).
