# Name Everything

看见一个东西，说出那句英文。面向手机的练习循环：一张图、一段思考倒计时，然后 Aha! / Forgot / Got it。

**目标：** 充满趣味性地让我们习惯用英语去思考、表达。

启发来自 [Learn How to Think In English](https://youtu.be/MpiWuR-yL9k)：给身边的东西起英文名、用画面而不是翻译记词、跟读、把一天里的小片段活在英语里。

**试用：** [https://ochprince.github.io/name-everything/](https://ochprince.github.io/name-everything/)

English README: [README.md](README.md).

## Disclaimer

本项目仅供个人学习与技术交流，不作任何商业用途。练习卡片中的图片、音频等素材通过第三方 CDN 引用，版权归原权利人所有；本仓库不对其主张权利，亦不保证可长期可用。

如权利人认为存在侵权，请通过 GitHub Issues 或仓库所有者联系方式告知，我们将在核实后尽快下架或移除相关内容。

This project is for personal learning and technical exchange only, and is not intended for commercial use. Card images and audio are hotlinked from a third-party CDN; copyright remains with the respective rights holders. This repository claims no ownership of that media and does not guarantee long-term availability.

If you believe any content infringes your rights, please open a GitHub Issue or contact the repository owner. We will review the request and remove or take down the material promptly.

## 快速开始

```bash
npm install
npm run dev      # 本地开发
npm test         # 单元测试（Vitest）
npm run build    # 生产构建
```

## 规格

设计规格见：[`docs/superpowers/specs/2026-08-13-name-everything-mvp-design.md`](docs/superpowers/specs/2026-08-13-name-everything-mvp-design.md)  
限时回忆见：[`docs/superpowers/specs/2026-08-16-timed-recall-design.md`](docs/superpowers/specs/2026-08-16-timed-recall-design.md)  
Grammar Everything：[`docs/superpowers/specs/2026-08-22-grammar-everything-design.md`](docs/superpowers/specs/2026-08-22-grammar-everything-design.md)  
实现计划：[`docs/superpowers/plans/2026-08-22-grammar-everything.md`](docs/superpowers/plans/2026-08-22-grammar-everything.md)

## 练习 Home

**练习** Tab 在 `/` 打开模块选择（进入具体模块前不会开始倒计时）：

| 磁贴 | 路由 | 说明 |
|------|------|------|
| 词汇记忆 | `/practice/pictures` | 看图限时回忆（Name Everything） |
| 语法学习 | `/practice/grammar/learn` | 章节 → 关卡 → 学习页 → 下落填槽 |
| 挑战模式 | `/practice/grammar/play` | 限时挑战，赢取奖杯；池 ≥ 30 且 30/30 通关得奖杯 |

语法课程内容存放在 **Supabase**（`chapters`、`grammar_points`、`levels`、`sentences`、`sentence_spans`、`sentence_slots`、`game_tuning`），应用启动时通过 Data API 加载。新课写成 `supabase/migrations/` 下的 SQL migration（见 `.cursor/skills/grammar-content-pack`），push 后由 GitHub 关联的 Supabase 自动应用。用 `npm run grammar:validate` 与 `npm run grammar:coverage` 校验。

本地开发：复制 `.env.example` 为 `.env.local`，填写 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_PUBLISHABLE_KEY`。GitHub Pages 构建需在仓库 Secrets 中配置同名变量（见 `deploy-pages.yml`）。数据库密码仅用于 Supabase CLI / 直连 Postgres（在 shell 中设置 `SUPABASE_DB_PASSWORD`，不要放进 Vite 环境变量）。

语法报错在 **我的** 可导出本机记录；配置 Supabase 后也会写入 `asset_reports` 表。

## 路线图

- [x] **Name Everything** — 点一下：1 幅图 + 1 个词 + 1 句可说的话。倒计时给予适当压力，配合复习形成从场景到词汇的思维惯性。
- [x] **Grammar Everything（替换）** — 学习页 + 限时下落填槽 + 已过关混合局；仓库内第一章可玩。*识别* 与 *重组* 仍在路线图。规格：[`docs/superpowers/specs/2026-08-22-grammar-everything-design.md`](docs/superpowers/specs/2026-08-22-grammar-everything-design.md)。计划：[`docs/superpowers/plans/2026-08-22-grammar-everything.md`](docs/superpowers/plans/2026-08-22-grammar-everything.md)。草稿：[`docs/thought/2026-08-22-grammar-everything.md`](docs/thought/2026-08-22-grammar-everything.md)。
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
4. **挑战模式的本质仍是识别，未达替换** — 目前挑战模式（及关卡练习）都是在拿已有例句做考察：认出结构、填已有句子的空，本质是考察对例句的掌握程度。识别 = 语法学习 + 例句学习；替换 = 真正学会用该语法造句（换主语/宾语/动词生成新句子），而不是背例句。挑战模式需要朝"替换"演进——例如生成式题目：给定语法骨架 + 中文意思，学习者自己产出英文句子。

## 第一周范围外

上面的产品设想放在路线图里，不在第一周范围。

- 长尾卡片的 AI 生成
- 拍照 / 识图模式
- Capacitor 原生壳或上架应用商店
- 正式产品命名与品牌打磨
- 多设备账号与同步
- 正式间隔重复（SRS）调度
- 把百词斩的 jpeg / mp3 二进制拷进本仓库

## 重新生成 T1 卡片

在仓库根目录执行（需要同级目录中有 `my_app`，且含 `assets/data/words/cet4-all`）：

```bash
node scripts/build-t1-pack.mjs
```

会写入 `src/features/pictures/content/t1-cards.json`（图片与音频为 CDN 地址）。

## 媒体说明

卡片图片与音频通过百词斩 CDN（`https://ali.bczcdn.com/r/…`）热链，仅用于练习接线。权属与下架说明见上方 **Disclaimer**。不要把当前词包当长期产品素材；商业化或上架前请换成已获授权的媒体。

## 第一周验证清单

本地执行 `npm run dev` 后做冒烟检查（完成后关掉开发服）：

- [ ] **Home** — 三个磁贴；`/` 无倒计时；未过关时挑战模式置灰，点击有提示
- [ ] **词汇记忆**（`/practice/pictures`）— 可见图片；cue 区为倒计时；Aha! 前单词 / 句子隐藏；超时亮答案、复习计数 +1，等 Next 再切下一张
- [ ] Aha! 后出单词和例句；Forgot / Got it 立即生效
- [ ] 一组 10 次练习 Got it 后出现「今日已完成」；继续后计数保持 10 / 10，可再来一组
- [ ] **语法学习** — 章列表；线性解锁；学习页可点 span；开始下落填槽；达门槛解锁下一关
- [ ] **挑战模式** — 分层抽样 30 句；分组加速；池 ≥ 30 且 30/30 通关得奖杯；Hub 显示历史与累计奖杯
- [ ] **复习** — Forgot 列表随操作更新；打开即出图+词+句
- [ ] **我的** — 今日数量、连续天数、思考时长持久化；可导出语法报错 JSON
- [ ] 手机视口可用（单列、点击区域够大）
