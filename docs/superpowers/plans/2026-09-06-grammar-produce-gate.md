# 举一反三关卡末题门闩 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 未过关且已开通 AI 的语法关卡，练习句清完后追加开放造句门闩，AI 合格才通关并写入候选。

**Architecture:** 纯函数决定是否进门闩 + `judgeProduceSentence` 调 `completeText` 解析 JSON；`FallingPlayPage` 在 `allQueueCleared` 将结算改为门闩阶段，通过后再 `status=over`。

**Tech Stack:** React + Vitest + 现有 `completeText` / `recordProduceCandidate` / `isAiAllowed`

## Global Constraints

- 仅 `mode === 'level'`；未开通 AI 跳过；已过关同样进门闩
- UI 不展示例句；不合格/错误可重试不扣命
- 中文文档：`README.md` / `MANIFEST.md` / `NOTES.md`

---

### Task 1: `shouldEnterProduceGate` + 判定解析

**Files:**
- Create: `src/features/grammar/lib/produceGate.ts`
- Create: `src/features/grammar/lib/produceGate.test.ts`

**Interfaces:**
- Produces: `shouldEnterProduceGate(...)`, `parseProduceJudgeResponse(text)`, `buildProduceJudgePrompt(...)`, `judgeProduceSentence(...)`

- [ ] **Step 1: 写失败测试**

```ts
import { describe, expect, it } from 'vitest'
import {
  shouldEnterProduceGate,
  parseProduceJudgeResponse,
} from './produceGate'

describe('shouldEnterProduceGate', () => {
  it('enters only for level, not passed, AI on, score met', () => {
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        levelPassed: false,
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(true)
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        levelPassed: true,
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'arcade',
        levelPassed: false,
        aiAllowed: true,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
    expect(
      shouldEnterProduceGate({
        mode: 'level',
        levelPassed: false,
        aiAllowed: false,
        score: 3,
        threshold: 3,
      }),
    ).toBe(false)
  })
})

describe('parseProduceJudgeResponse', () => {
  it('parses pass with zh', () => {
    expect(
      parseProduceJudgeResponse('{"pass":true,"zh":"我给他一本书。","reason":""}'),
    ).toEqual({ pass: true, zh: '我给他一本书。', reason: '' })
  })
  it('parses fail with reason from fenced json', () => {
    expect(
      parseProduceJudgeResponse(
        '```json\n{"pass":false,"zh":"","reason":"没有用到与格结构"}\n```',
      ),
    ).toEqual({ pass: false, zh: '', reason: '没有用到与格结构' })
  })
  it('treats pass without zh as fail', () => {
    const r = parseProduceJudgeResponse('{"pass":true,"zh":"","reason":""}')
    expect(r.pass).toBe(false)
  })
})
```

- [ ] **Step 2: 实现 `produceGate.ts`（判定门槛 + 解析 + prompt + `judgeProduceSentence`）**
- [ ] **Step 3: 测试通过**

---

### Task 2: `ProduceGatePanel` UI

**Files:**
- Create: `src/features/grammar/components/ProduceGatePanel.tsx`
- Create: `src/features/grammar/components/ProduceGatePanel.test.tsx`

**Interfaces:**
- Consumes: `titleZh`, `bodyZh`, `busy`, `feedback`, `draft`, callbacks
- Produces: 提交开放句的面板（知识点 + textarea + 提交）

- [ ] **Step 1: 测试渲染知识点、无例句、提交、busy、feedback**
- [ ] **Step 2: 实现面板**
- [ ] **Step 3: 测试通过**

---

### Task 3: 接线 `FallingPlayPage`

**Files:**
- Modify: `src/features/grammar/pages/FallingPlayPage.tsx`
- Modify: `src/features/grammar/pages/FallingPlayPage` 相关测试（若无则加 focused test 或 Learn 流程测）
- Modify: `NOTES.md`、`README.md`、`MANIFEST.md`

**Interfaces:**
- Consumes: `shouldEnterProduceGate`, `judgeProduceSentence`, `recordProduceCandidate`, `isAiAllowed`, `getOrCreateDeviceId`, `ProduceGatePanel`

- [ ] **Step 1: mount 时 prefetch `isAiAllowed`（level 模式）**
- [ ] **Step 2: `advanceToNextSentence` 在 `allQueueCleared` 时若需门闩 → 设 `produceGate` 态，不设 `over`**
- [ ] **Step 3: 门闩提交 → judge → 合格则 `recordProduceCandidate` + `over`；否则 feedback**
- [ ] **Step 4: 更新 README / MANIFEST / NOTES**
- [ ] **Step 5: 跑相关 vitest**

---

## Spec coverage

| Spec | Task |
|------|------|
| 追加门闩 N+1 | 3 |
| 仅 AI + 未过关 | 1, 3 |
| 不合格/错误可重试 | 2, 3 |
| UI 无例句 + 理由 | 2 |
| recordProduceCandidate | 3 |
| 过关后才 recordLevelScore | 3（延后 `over`） |
