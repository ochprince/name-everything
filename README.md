# Name Everything

看见一个场景，说出那句英文。

给已经会一点英语、却仍习惯先想中文的人。打开就能练：看图限时回忆，用一句生动的例句玩语法，过关后再去挑战。玩着玩着，用英语思考和表达会变成习惯。

**试用：** [https://ochprince.github.io/name-everything/](https://ochprince.github.io/name-everything/)

启发来自 [Learn How to Think In English](https://youtu.be/MpiWuR-yL9k)。

## 功能

练习：

- **词汇记忆** — 看图，倒计时里先想那句英文，再 Aha! / Forgot / Got it。词汇按批练习（每批约 50），每次练习10 个词汇，Forgot 进复习。揭示后可把例句「加入我的挑战」，也可对整词报错。
- **语法学习** — 每关先读一句生动的标杆句，哪里不会点哪里；然后玩游戏过关（限时选择或输入英文句子）。
- **挑战模式** — 语法过关或收藏了词汇例句后开门。可选 **语法挑战**（已学句子综合局）或 **我的挑战**（收藏例句，挖空后输入；有合格干扰项数据时才开四选一）。一局最多 30 句；题库够 30 且全部过完才给奖杯。

复习：

- **Forgot 列表** — 词汇里没想起的词会出现在这里。缩略图加例句（目标词高亮），点开同一张练习卡、直接看到答案。
- **Got it 再遇** — 复习里 Got it 不会立刻算完全会了，词会以更低频率回到练习再遇；再 Forgot 则继续留在队列。
- **角标提醒** — 底栏角标提示还有未看过的 Forgot。

我的：

- **练习统计** — 今日已练、连续天数（词汇记忆）。
- **节奏设置** — 思考时长、默认提示、自动发音、音效，以及语法游戏里填空 / 整句输入的占比。
- **语法报错** — 发现句子、讲解或词汇卡有问题可以报错；本机记录可复制或下载。

打开即练，无需账号。进度存在本机。能力与设计用意见 [MANIFEST.md](MANIFEST.md)。

## 本地运行

```bash
npm install
cp .env.example .env.local   # 填写 Vite Supabase 密钥（见 DATABASE.md）
npm run dev      # 本地开发
npm test         # 单元测试（Vitest）
npm run build    # 生产构建
```

词库与语法课包在远程，步骤见 [DATABASE.md](DATABASE.md)。

## 路线图

- [x] **Name Everything** — 点一下：1 幅图 + 1 个词 + 1 句可说的话。倒计时加压；Forgot 复习；每日 10 次 Got it 成组；全量 CET4 按 50 词一批推进。
- [x] **Grammar Everything（替换）** — 学习页 + 限时下落填槽 + 已过关混合局。学习页点选与整句输入已覆盖早期规格里的「识别 / 重组」入口。
- [ ] **Listen & Repeat** — 把「你刚说的」或场景例句做成跟读 + 录音，再编成锦集定时推送播放。直观感受到自己的努力和进步，嘴脑联动。
- [ ] **Live Small Moments** — 按场景触发：起床、通勤、吃饭、逛街的 60 秒挑战。AI 询问当前正在做什么，根据回答生成 60 秒场景对话挑战——更贴合生活实际，也更有互动感和压力感。
- [ ] **可理解输入内容** — 基于可理解输入设计内容：增加阅读量，并逐步提升。
- [ ] **影子跟读法** — 用影子跟读不断练习标准发音和口语，强调要大声地说出来。

### 暂不考虑

- 长尾卡片的 AI 生成
- 拍照 / 识图模式
- Capacitor 原生壳或上架应用商店
- 正式产品命名与品牌打磨
- 多设备账号与同步
- 正式间隔重复（SRS）调度
- 把百词斩的 jpeg / mp3 二进制拷进本仓库

## 相关文档


| 文档                         | 内容        |
| -------------------------- | --------- |
| [MANIFEST.md](MANIFEST.md) | 产品能力与设计用意 |
| [DATABASE.md](DATABASE.md) | 内容库、上传与备份 |
| [DESIGN.md](DESIGN.md)     | 视觉        |
| [NOTES.md](NOTES.md)       | 已知问题与设计备忘 |


## 声明

卡片图片与音频通过百词斩 CDN（`https://ali.bczcdn.com/r/…`）热链，仅用于练习接线。库内只存文件名，前端拼 CDN 前缀。不要把当前词包当长期产品素材；商业化或上架前请换成已获授权的媒体。

本项目仅供个人学习与技术交流，不作任何商业用途。练习卡片中的图片、音频等素材通过第三方 CDN 引用，版权归原权利人所有；本仓库不对其主张权利，亦不保证可长期可用。

如权利人认为存在侵权，请通过 GitHub Issues 或仓库所有者联系方式告知，我们将在核实后尽快下架或移除相关内容。

This project is for personal learning and technical exchange only, and is not intended for commercial use. Card images and audio are hotlinked from a third-party CDN; copyright remains with the respective rights holders. This repository claims no ownership of that media and does not guarantee long-term availability.

If you believe any content infringes your rights, please open a GitHub Issue or contact the repository owner. We will review the request and remove or take down the material promptly.