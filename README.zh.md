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
| 语法游戏 | `/practice/grammar/play` | 仅混合已过关关卡的 playable 句 |

语法课程内容在 `src/features/grammar/content/*.json`；手感数字在 `game_tuning.json`。语法报错可在 **我的** 导出。

## 路线图

- [x] **Name Everything** — 点一下：1 幅图 + 1 个词 + 1 句可说的话。倒计时给予适当压力，配合复习形成从场景到词汇的思维惯性。
- [x] **Grammar Everything（替换）** — 学习页 + 限时下落填槽 + 已过关混合局；仓库内第一章可玩。*识别* 与 *重组* 仍在路线图。规格：[`docs/superpowers/specs/2026-08-22-grammar-everything-design.md`](docs/superpowers/specs/2026-08-22-grammar-everything-design.md)。计划：[`docs/superpowers/plans/2026-08-22-grammar-everything.md`](docs/superpowers/plans/2026-08-22-grammar-everything.md)。草稿：[`docs/thought/2026-08-22-grammar-everything.md`](docs/thought/2026-08-22-grammar-everything.md)。
- [ ] **Listen & Repeat** — 把「你刚说的」或场景例句做成跟读 + 录音，再编成锦集定时推送播放。直观感受到自己的努力和进步，嘴脑联动。
- [ ] **Live Small Moments** — 按场景触发：起床、通勤、吃饭、逛街的 60 秒挑战。AI 询问当前正在做什么，根据回答生成 60 秒场景对话挑战——更贴合生活实际，也更有互动感和压力感。

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

- [ ] **Home** — 三个磁贴；`/` 无倒计时；未过关时语法游戏置灰，点击有提示
- [ ] **词汇记忆**（`/practice/pictures`）— 可见图片；cue 区为倒计时；Aha! 前单词 / 句子隐藏；超时亮答案、复习计数 +1，等 Next 再切下一张
- [ ] Aha! 后出单词和例句；Forgot / Got it 立即生效
- [ ] 一组 10 次练习 Got it 后出现「今日已完成」；继续后计数保持 10 / 10，可再来一组
- [ ] **语法学习** — 章列表；线性解锁；学习页可点 span；开始下落填槽；达门槛解锁下一关
- [ ] **语法游戏** — 仅混合 playable；Hub 页有历史得分
- [ ] **复习** — Forgot 列表随操作更新；打开即出图+词+句
- [ ] **我的** — 今日数量、连续天数、思考时长持久化；可导出语法报错 JSON
- [ ] 手机视口可用（单列、点击区域够大）
