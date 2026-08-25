# 语法下落玩法：产出回忆题（Produce）设计

**日期：** 2026-08-25  
**状态：** 已批准，待实现

## 背景

挑战模式与关卡练习目前都是槽位四选一，本质是**识别**已学例句，而非**替换/产出**。内容会持续更新，且新用户首遇游戏句时若要求整句输入，已接近「按中文产出英文」的替换压力。本轮先落地**回忆产出**（中文 → 输入英文 → 与该句 `en` 宽松比对），不引入新句生成。

## 目标

- 关卡练习与挑战模式中，约 **50%** 的句子改为整句英文输入题（`produce`），其余保持四选一（`mcq`）。
- 输入题难度高于四选一，但仍复用现有下落、扣命、计分与结算。
- 判题宽松：忽略大小写与标点，常见缩写与完整式等价。

## 非目标（本轮不做）

- 真替换：生成与标杆不同的新目标句
- 语法骨架 / 空槽提示 UI
- 困难/地狱难度模式、刷分漏洞修复
- 改动内容包 JSON 结构（仍用现有 `en` / `zh` / slots）

## 玩法规则

| 项 | 约定 |
|----|------|
| 范围 | `FallingPlayPage` 的 `level` + `arcade` |
| 抽题粒度 | **每句独立** 50% → `produce`，否则 `mcq`（含关卡 anchor） |
| `mcq` | 现状不变：按 `SentenceSlot` 四选一，严格等于 `slot.correct` |
| `produce` UI | 下落中文 `zh`；底部选项区改为输入框 + 提交；**不**显示骨架/空槽 |
| `produce` 判题 | 用户输入 vs `sentence.en`，经 `englishAnswersMatch` |
| 时限 | 仍下落；`fallDurationMs = base × 1.5`；落地未提交 = 本句失败扣命 |
| 答错 | 与四选一相同：不立即死句，`applyWrong` 加速，可再提交 |
| 答对 | 本句清除 +1 分，进入下一句（跳过槽位推进） |
| 空提交 | 忽略：不判对、不扣命、不加速；提示用户输入后再提交 |

## 宽松比对

纯函数建议放在 `src/features/grammar/lib/englishAnswerCompare.ts`：

1. 转小写  
2. 常见缩写展开为完整式（两边都归一后再比），至少覆盖：  
   - `it's` → `it is`，`i'm` → `i am`，`you're` / `we're` / `they're` → `… are`  
   - `there's` → `there is`，`there're` → `there are`  
   - 其它常见 `'s` / `'re` / `'m` / `'ll` / `'ve` / `'d` 与否定缩写（`don't`、`isn't`、`can't`→`cannot`、`won't` 等）  
3. 去掉句号、问号、感叹号、逗号、分号、冒号、引号等标点；缩写处理后再清残留撇号  
4. trim，连续空白压成单空格  
5. 归一化后字符串全等 → 正确  

**不做：** 近义改写、词序容错、冠词 a/an 互换、拼写纠错。

## 架构与落点

### 调参

`game_tuning.json`（及对应 TypeScript 类型）新增：

- `produce_answer_ratio: 0.5`
- `produce_fall_duration_factor: 1.5`

### 引擎

`lib/engine.ts`：

- `AnswerMode = 'mcq' | 'produce'`
- `FallingState` 增加 `answerMode`
- `pickAnswerMode(ratio)`：按 ratio 随机
- 换句 / `startRound` 时写入 `answerMode`；若为 `produce`，`fallDurationMs` 与 `remainingMs` 使用 `base × produce_fall_duration_factor`
- `produce` 答对：直接 cleared（不经 `advanceSlot`）

### UI

`FallingPlayPage.tsx`：按 `state.answerMode` 分支渲染四选项或输入提交；提交走 `englishAnswersMatch`。

### 文档

同步更新 `README.md` / `README.zh.md` 中「识别未达替换」备忘：标明已引入 50% 产出回忆题，真替换仍待后续。

## 数据流（单句）

```
next sentenceId
  → pickAnswerMode(0.5)
  → start/resume round with answerMode + fallDuration
  → mcq: slotOptions → pick(option === correct)
  → produce: input → englishAnswersMatch(input, sentence.en)
  → wrong: applyWrong | right: clear + next | timeout: lose life
```

## 测试

- `englishAnswerCompare`：标点、大小写、缩写等价、多空格
- `pickAnswerMode` / produce 时限倍数（可用注入 RNG 或样本统计）
- 现有 engine / arcade 测试不回归

## 决议摘要

- 题型：回忆产出（比对该句 `en`），非本轮真替换生成  
- 比例：按句 50%  
- 时限：1.5× 仍下落  
- 答错：同四选一加速可重试  
- 提示：仅中文，无骨架  
- 模式：关卡 + 挑战都开  
- 比对：忽略大小写 + 去标点 + 缩写展开  
