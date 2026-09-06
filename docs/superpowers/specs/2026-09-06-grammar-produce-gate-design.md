# 举一反三：关卡末题开放造句门闩

**日期：** 2026-09-06  
**状态：** 已批准（方案 1，直接开发）

## 目标

语法学习关卡（`mode === 'level'`）在练习句全部清完后，对**已开通 AI** 的设备追加一道开放造句门闩（含已过关重打）；AI 判定合格才进结算并记分/通关，合格句写入造句候选管道。

## 决议

| 项 | 选择 |
|----|------|
| 挂法 | 练习句清完后**追加**门闩（N+1），不替换课包句 |
| 谁看见 | 仅 `isAiAllowed`；未开通 = 现有「清完即结算/过关」 |
| 已过关 | 同样追加门闩（重打也可造句沉淀） |
| 不合格 | 留门闩改写再交；不扣命、不回练习句 |
| 判定失败 | 超时/配额/网络等同交互：提示后可再交，不放行 |
| 刺激物 | UI 只显示知识点 `title_zh` + `body_zh`，**不**展示例句 |
| 不合格反馈 | 展示 AI 短中文理由（1–2 句） |
| 合格沉淀 | `recordProduceCandidate({ levelId, en, zh, deviceId })`；`zh` 由同轮 AI 产出 |
| 通关写入 | 门闩通过（或跳过门闩）后才 `status=over` → `recordLevelScore` |

## 架构

局内追加阶段（不改路由）：

```
练习句全清 + score≥threshold
  → 未开通 AI → status=over（现状）
  → 否则 → produce_gate UI
       → 提交 → completeText 判题
       → pass → recordProduceCandidate → status=over
       → fail/error → 留门闩 + 文案
```

- 判题模块：`judgeProduceSentence`（组 prompt、调 `completeText`、解析 JSON）
- Prompt **后台**可带本关练习句摘要供模型参照；界面永不展示
- UI：无下落；复用输入+提交交互；展示知识点与提示「你能用这个语法造一个新句子吗？」

## 判定协议

AI 返回可解析 JSON（允许包在 markdown 代码块里）：

```json
{ "pass": true, "zh": "中文译文", "reason": "" }
{ "pass": false, "zh": "", "reason": "简短中文理由" }
```

- `pass === true` 且 `zh` 非空 → 合格
- 否则不合格；`reason` 缺省时用固定兜底文案
- 判定标准（写进 instructions）：须体现本关知识点、语法正确、不得照搬课包例句（含标杆）

## 非目标

- 挑战 / 词汇局不加门闩
- 改课包 JSON / sentences 表结构
- 中高阶问答、场景挑战
- 门闩扣命或限次

## 测试要点

- `shouldEnterProduceGate`：mode/AI/分数组合
- 解析：裸 JSON、代码块、缺字段、非 JSON
- 接线：清完 → 门闩 → 合格才 `recordLevelScore`；不合格不结算
