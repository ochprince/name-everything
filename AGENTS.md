# Agent notes

## README localization

This repo keeps **two** user-facing READMEs in sync:

| File | Language |
|------|----------|
| `README.md` | English (canonical for GitHub) |
| `README.zh.md` | Chinese |

**Whenever you add, change, or remove user-facing documentation for a new feature, behavior change, try-it link, setup step, scope note, or checklist item, update both files.** Do not edit only one.

Guidelines:

- Keep structure and meaning aligned; section order should match when practical.
- `README.md` stays English-primary; `README.zh.md` stays Chinese-primary.
- Exception: the **Disclaimer** block may stay bilingual in both files.
- Proper nouns (e.g. Name Everything, Got it, Forgot, Vite, Vitest, T1, CDN URLs, paths, npm scripts) can remain as-is in either file.
- Cross-links: English README points to `README.zh.md`; Chinese README points to `README.md`.
