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

## Ask Me

当任务需要我做出决策或提供额外信息才能继续时，以及当整个任务成功结束时，使用 `telegram-wait` 工具的 `ask_and_wait` 功能向我发送message报告。如果ask_and_wait返回指示，需要进一步处理并将处理结果再次发送给我。