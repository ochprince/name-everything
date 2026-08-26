# Name Everything

看见一个场景，说出那句英文。

给已经会一点英语、却仍习惯先想中文的人。打开就能练：看图限时回忆，用一句生动的例句玩语法，过关后再去挑战。玩着玩着，用英语思考和表达会变成习惯。

**试用：** [https://ochprince.github.io/name-everything/](https://ochprince.github.io/name-everything/)

启发来自 [Learn How to Think In English](https://youtu.be/MpiWuR-yL9k)。

## 快速开始

```bash
npm install
cp .env.example .env.local   # 填写 Vite Supabase 密钥（见 DATABASE.md）
npm run dev      # 本地开发
npm test         # 单元测试（Vitest）
npm run build    # 生产构建
```

## 练习 Home

**练习** Tab 在 `/` 打开模块选择（进入具体模块前不会开始倒计时）：


| 磁贴   | 路由                        | 说明                                            |
| ---- | ------------------------- | --------------------------------------------- |
| 词汇记忆 | `/practice/pictures`      | 看图限时回忆；四级词库在 Supabase `picture_words`，每批 50 词 |
| 语法学习 | `/practice/grammar/learn` | 章节 → 关卡 → 学习页 → 下落填槽（远程课包）                    |
| 挑战模式 | `/practice/grammar/play`  | 限时挑战，赢取奖杯；池 ≥ 30 且 30/30 通关得奖杯                |


语法课包与四级词汇表都在远程 Supabase，步骤见 [DATABASE.md](DATABASE.md)。词汇进度（strong / warm / forgot / 批次 offset）只存在浏览器 `localStorage`。语法报错在 **我的** 可导出本机记录；配置 Supabase 后也会写入 `asset_reports` 表。

## 路线图

- [x] **Name Everything** — 点一下：1 幅图 + 1 个词 + 1 句可说的话。倒计时加压；Forgot 复习；每日 10 次 Got it 成组；全量 CET4 按 50 词一批推进（不再用本地小包 `t1-cards.json`）。
- [x] **Grammar Everything（替换）** — 学习页 + 限时下落填槽 + 已过关混合局；内容在 Supabase。*识别* 与 *重组* 仍在路线图。规格：`[docs/superpowers/specs/2026-08-22-grammar-everything-design.md](docs/superpowers/specs/2026-08-22-grammar-everything-design.md)`。计划：`[docs/superpowers/plans/2026-08-22-grammar-everything.md](docs/superpowers/plans/2026-08-22-grammar-everything.md)`。草稿：`[docs/thought/2026-08-22-grammar-everything.md](docs/thought/2026-08-22-grammar-everything.md)`。
- [ ] **Listen & Repeat** — 把「你刚说的」或场景例句做成跟读 + 录音，再编成锦集定时推送播放。直观感受到自己的努力和进步，嘴脑联动。
- [ ] **Live Small Moments** — 按场景触发：起床、通勤、吃饭、逛街的 60 秒挑战。AI 询问当前正在做什么，根据回答生成 60 秒场景对话挑战——更贴合生活实际，也更有互动感和压力感。
- [ ] **可理解输入内容** — 基于可理解输入设计内容：增加阅读量，并逐步提升。
- [ ] **影子跟读法** — 用影子跟读不断练习标准发音和口语，强调要大声地说出来。

## 已知问题与设计备忘

Grammar 限时下落填槽玩法——用户评审记录（2026-08-25）：

1. **刷分漏洞** — 快速连点四个选项即可试出答案：答错不会立即死亡（每句有 3 次机会），第 4 次必过，因此可以用来刷分。
2. **想法：难度模式** —
  - 困难模式：每个选项只有一次错误机会。
  - 地狱模式：每个选项没有错误机会。
3. **「我的」设置项分组** — 现在「我的」里有很多配置项，但部分属于记忆单词模块、部分属于语法学习与挑战模式；应按模块对配置项做章节/分块分组，让页面更优雅清晰（后续语法游戏模式、难度选择也可能放进配置项，数量增多后不分组会很混乱）。备选方案：重新设计「我的」页面，把设置做成独立单页，由「我的」提供一个设置入口点击进入——这也是大多数 APP 的实现方式。

## 暂未纳入范围

上面的产品设想放在路线图里；下列能力目前仍未做：

- 长尾卡片的 AI 生成
- 拍照 / 识图模式
- Capacitor 原生壳或上架应用商店
- 正式产品命名与品牌打磨
- 多设备账号与同步
- 正式间隔重复（SRS）调度
- 把百词斩的 jpeg / mp3 二进制拷进本仓库

## 媒体说明

卡片图片与音频通过百词斩 CDN（`https://ali.bczcdn.com/r/…`）热链，仅用于练习接线。库内只存文件名，前端拼 CDN 前缀。权属与下架说明见文末 **Disclaimer**。不要把当前词包当长期产品素材；商业化或上架前请换成已获授权的媒体。

## 冒烟验证清单

本地执行 `npm run dev` 后做冒烟检查（完成后关掉开发服）。需已配置 `.env.local` 且 `picture_words` 已上传：

- [ ] **Home** — 三个磁贴；`/` 无倒计时；未过关时挑战模式置灰，点击有提示
- [ ] **词汇记忆**（`/practice/pictures`）— 从 Supabase 拉本批 50 词；可见图片；cue 区倒计时；Aha! 前单词 / 句子隐藏；超时亮答案、复习计数 +1，等 Next 再切下一张
- [ ] Aha! 后 Forgot / Got it；练习 Got it 进入 strong；本批若只剩 Forgot 则提示「请先复习」
- [ ] 一组 10 次练习 Got it 后出现「今日已完成」；继续后计数保持 10 / 10，可再来一组
- [ ] 本批 50 词全部 strong 后自动进入下一批
- [ ] **语法学习** — 章列表；线性解锁；学习页可点 span；开始下落填槽；达门槛解锁下一关
- [ ] **挑战模式** — 分层抽样 30 句；分组加速；池 ≥ 30 且 30/30 通关得奖杯；Hub 显示历史与累计奖杯
- [ ] **复习** — 按 forgot 词从 Supabase 拉详情；打开即出图+词+句；复习 Got it 进入 warm（可再进练习池）
- [ ] **我的** — 今日数量、连续天数、思考时长持久化；可导出语法报错 JSON
- [ ] 手机视口可用（单列、点击区域够大）

## Disclaimer

本项目仅供个人学习与技术交流，不作任何商业用途。练习卡片中的图片、音频等素材通过第三方 CDN 引用，版权归原权利人所有；本仓库不对其主张权利，亦不保证可长期可用。

如权利人认为存在侵权，请通过 GitHub Issues 或仓库所有者联系方式告知，我们将在核实后尽快下架或移除相关内容。

This project is for personal learning and technical exchange only, and is not intended for commercial use. Card images and audio are hotlinked from a third-party CDN; copyright remains with the respective rights holders. This repository claims no ownership of that media and does not guarantee long-term availability.

If you believe any content infringes your rights, please open a GitHub Issue or contact the repository owner. We will review the request and remove or take down the material promptly.
