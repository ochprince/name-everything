# Name Everything MVP — Design Spec

**Date:** 2026-08-13  
**Status:** Draft for review  
**Product working name:** TBD（与「图说英语 / 旺卡单词」解耦；正式名后定）

## 1. Problem

现有「拍照识图学英语」类产品难成习惯，主因两条：

1. **场景太重**：专门掏出手机、对准、等识别——撑不起刷牙 / 走路 / 泡茶等微时刻。  
2. **输出太浅**：给名词或例句，但缺少「你开口说 / 你心里默念」的路径与可复习的痕迹。

参考练习（Think in English）：Name everything、Pictures not translation、Listen & repeat、Live small moments。本 MVP **只落地前两者的产品化形式**，后两者明确后置。

## 2. Goals

**成功长什么样**  
用户愿意在碎片时间打开 App/网页，完成若干次「看见 → 英文直接反应」；Got it / Forgot / 记录 三态让练习可积累、可复习。

**首周验证目标（Web）**  
设计者或 3–5 名目标用户连续数天愿意打开「练习」、三按钮不别扭、复习列表有用。不要求账号、留存后台或上架。

**非目标（本 MVP）**

- 跟读评分、录音锦集、定时推送回放  
- 60 秒生活场景挑战（Live small moments）  
- 语法成分分析课；不以百词斩词库为长期产品资产（首周 CDN 占位除外）  
- 多设备账号同步、正式间隔重复（SRS）算法  
- 应用商店上架（验证通过后再 Capacitor 封壳）

## 3. Users

**主用户：** 有一定英语基础，但习惯在脑子里先翻译，需要练「场景 → 英文直接反应」的速度与默念习惯。

**不是主用户：** 零基础背词者（不靠本产品系统教词表）。

**界面语言：** 导航/设置可用中文。  
**学习内容：** 默认不出现中文；中文释义可折叠。英文目标词同样 **默认折叠**。

## 4. Core loop — Name everything

一次练习：

1. 用户点一下（或进入练习流自动出下一张）。  
2. 展示：**1 幅图 + 1 句可说英文**（主视觉）。  
3. **英文目标词**、**中文释义**均默认折叠，用户可手动展开。  
4. 看 / 默念即可（首周不做录音义务）。  
5. 三选一结束本卡：  
   - **Got it**（主按钮）— 过了  
   - **Forgot** — 不熟，进加强复习队列  
   - **记录** — 主动钉进「我的清单」，便于日后复习（≠ Forgot）

可选：词/句播放小按钮（CDN 音频优先，TTS 兜底），不挡主路径。

## 5. Information architecture

底部导航三栏：

| Tab | 职责 |
|-----|------|
| **练习** | 默认首页；Name everything 主循环 |
| **复习** | Forgot 队列 + 「记录」清单 |
| **我的** | 今日次数、连续天数、设置（含「默认展开中文 / 默认展开目标词」，默认均关） |

### 5.1 练习页

- 轻量今日进度（已练 N / 或本轮剩余），避免课程式压迫进度条。  
- 中部大图；其下可说句（始终可见）。  
- 底部固定：`Forgot` | `记录` | `Got it`（Got it 视觉权重最高）。  
- 已记录时，「记录」可变为「已记录」并支持取消。

### 5.2 复习页

- 子分段/Tab：`Forgot` | `记录`。  
- 点入后复用同一卡面与三按钮。  
- 空状态引导去练习，避免责备文案。

### 5.3 队列规则（简单版，非 SRS）

| 动作 | 效果 |
|------|------|
| Got it | 计入今日完成；若在 Forgot 中则可移出 Forgot；「记录」保留除非用户取消 |
| Forgot | 写入 Forgot 队列；后续练习或复习中优先出现 |
| 记录 | pin 进记录清单；不自动等同 Forgot |
| 取消记录 | 从记录清单移除 |

抽卡顺序（练习流）：

1. Forgot 最多占本轮约 30%（避免整轮挫败）。  
2. 其余从手选池按 tag 轮换。  
3. 当日已 Got it 的降权，非永久移除。

## 6. Content model

### 6.1 Card (Atom)

| Field | Notes |
|-------|--------|
| `id` | Stable id |
| `word` | English target word（默认折叠） |
| `sentence` | One speakable, spoken-register sentence |
| `image` | Path or URL（首周为百词斩 CDN） |
| `imageSource` | `curated` \| `baicizhan` \| `ai` \| `camera` |
| `zh` | Optional Chinese gloss（默认折叠） |
| `tags` | e.g. `home` `street` `food` `body` |
| `tier` | `T1` \| `T2` \| `T3` |
| `wordAudio` | Optional word mp3 URL |
| `sentenceAudio` | Optional sentence audio URL |
| `audioHint` | Optional TTS text; default = word/sentence |

**图像原则：** 图是「what's this」语义锚点，单主体日常物/微场景；不为「例句剧情」服务。  
**首周占位：** 从图说英语的产品定位出发，长期仍须自有/可授权图。验证阶段允许热链百词斩 CDN（与 `my_app` 相同：`https://ali.bczcdn.com/r/{file}`），**不把图/音频二进制拷进 git**。上架或公开分发前必须替换。

### 6.2 Difficulty tiers

| Tier | Focus | Word | Sentence |
|------|--------|------|----------|
| T1 | Name common objects | High-freq / visible nouns | Ideal: `This is a cup.` / `The door is open.`；**首周**用 CET4 具体名词的百词斩原句 |
| T2 | Object + simple action/state | Noun + common verb/adj | `I'm holding a cup.` |
| T3 | Fuller life sentence | Still visually anchored | One-breath length; no grammar jargon |

首周默认只开 **T1**；UI 不强调「第几课」。

### 6.3 Source mix

- **Week-1 占位包：** 从 `my_app/assets/data/words/cet4-all`（约 2315 词）筛选 ≥30 个**具体可见名词**（`mean_cn` 以 `n.` 开头；home/street/food/body）。CET4 没有 `cup`/`door` 这类小学词，T1 池是「能指着说名字」的四级具体物。  
- **音频/例句：** 保留百词斩原句 + `word_audio` / `sentence_audio`（CDN）。浏览器 TTS 仅作失败兜底。丢掉例句含 Baicizhan 品牌、词性不是名词、或 JSON 例句截断的条目。  
- **Curated（长期核心）：** 约 80–150 张可授权高频日常物，替换 CDN 占位。  
- **AI（长尾）：** 「换一批」或池不足时生成并缓存；约束单主体、日常、无文字水印、无中文。  
- **Camera（进阶）：** 拍照 → 1 主物 + 1 词 + 1 句；可「记录」。首周可为弱入口或隐藏，不作为默认路径。

## 7. Technical approach

**策略：** 方案 1（React 技术栈全新产品）+ 首周按方案 3 做 **移动 Web 验证**；验证后再 Capacitor 封壳。

| Layer | Choice |
|-------|--------|
| New repo | 独立仓库/目录；不在 picture-talk 或 my_app 上改主循环 |
| Frontend | React + Vite + TypeScript，移动单栏优先 |
| Styling | Design tokens (CSS variables) + Tailwind（或等价） |
| Content | Static JSON pack for week 1；图/音热链百词斩 CDN |
| State | localStorage / IndexedDB：三态、今日计数、连续天 |
| AI API | Optional；相机/长尾可后接；手选包即可验证循环 |
| Auth | None in week 1 |
| Deploy | Shareable HTTPS URL on phone |

**Capacitor 预留：** 业务在 Web 层；设备能力经适配层（相机等）；避免浏览器专用死胡同写法。

**可借鉴、不可绑死：**

- picture-talk：Vite/React、AI 调用形态、日后 Capacitor  
- my_app：卡片循环灵感 + 首周内容占位（cet4-all JSON 字段 + `ali.bczcdn.com` 热链）；不复制其 Flutter 主循环，不把词图二进制打进新仓库

## 8. Week-1 build scope

**Must**

- 三 Tab 壳 + 练习卡面（图 + 句可见；词/中文默认折叠）  
- Got it / Forgot / 记录 + 复习列表  
- T1 内容包（从 cet4-all 筛 30–50 张具体名词；CDN 图/原句/原音频）  
- 今日次数（本地）

**Should**

- 播词/句（CDN 音频优先，TTS 兜底）  
- 简单 tag 轮换抽卡  

**Could**

- AI 换一批  
- 相机进阶入口  

**Won't（本周）**

- 账号、跟读、生活挑战、上架、复杂 SRS  

## 9. Later roadmap (out of MVP)

1. **Listen & repeat** — 跟读 + 录音；锦集回放感知进步  
2. **Live small moments** — 场景触发的 60 秒挑战  
3. Capacitor 上架、推送/小组件等习惯召回  
4. 账号与跨设备同步；更稳的复习调度  

## 10. Open decisions

- 正式产品名与品牌语气  
- 长期可授权图/音的采购或拍摄（替换百词斩 CDN）  
- 三按钮文案最终用英文、中文还是混用（草案：`Forgot` / `记录` / `Got it`）  

## 11. Approval record

| Topic | Decision |
|-------|----------|
| Product type | 新产品（C），非旧 App 小改 |
| Base | React 新壳；首周 Web 验证 |
| Content | 长期：手选 + AI 长尾 + 相机进阶。首周：cet4-all 具体名词 + 百词斩 CDN 占位 |
| Sentences | 首周保留百词斩原句与句音频（选项 A） |
| User | 有基础、戒翻译 |
| Completion | 看/默念即可；按钮含 Got it / Forgot / 记录 |
| Reveal | 目标词与中文默认折叠；句与图默认可见 |
| Repo | `E:/Workspace-Web/name-everything` |
