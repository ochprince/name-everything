# Agent notes

## README

面向用户的说明只有一份：**中文写在 `README.md`**（GitHub 仓库首页默认展示这个文件）。产品给中文用户用，不要再维护英文版或 `README.zh.md`。

**Whenever you add, change, or remove user-facing documentation for a new feature, behavior change, try-it link, setup step, scope note, or checklist item, update `README.md`.**

Guidelines:

- `README.md` 以中文为主。
- Exception: the **Disclaimer** block may stay bilingual (rights holders may not read Chinese).
- Proper nouns (e.g. Name Everything, Got it, Forgot, Vite, Vitest, T1, CDN URLs, paths, npm scripts) can remain as-is.

## Ask Me

当任务需要我做出决策或提供额外信息才能继续时，以及当整个任务成功结束时，使用 `telegram-wait` 工具的 `ask_and_wait` 功能向我发送message报告。如果ask_and_wait返回指示，需要进一步处理并将处理结果再次发送给我。