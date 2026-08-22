# Grammar Everything — Design Spec

**Date:** 2026-08-22  
**Status:** Draft for review  
**Working name:** Grammar Everything（练习 Home 上的语法模块）  
**Theory:** [`docs/thought/2026-08-22-grammar-everything.md`](../../thought/2026-08-22-grammar-everything.md)（例句锚定法：识别 → 替换 → 重组）

## 1. Problem

只背一条语法标杆句，不等于掌握规则。变人称、换动词后不会造句，说明记住的是那一行字。

本模块把「识别」落在学习页（一条语法、一句可点的标杆），把「替换」落在限时下落填槽：同类语法、不同内容的句子反复选对成分。趣味来自游戏，压力来自限时与生命，习惯来自多轮替换。

## 2. Goals

用户愿意从练习 Home 走进语法学习，按关打通第一章，并能在语法游戏里混合已过关内容刷分。课程目录可改、游戏数字可调、报错可导出，不依赖后端。

**本期成功标准**

- 练习入口是 Home：先选再开始；看图说句倒计时不会在进入 App 时自动响起。
- 第一章可学、可打、可过关；其余章节在列表可见但锁住。
- 下落填槽手感数字全部来自配置，改配置不必改组件逻辑。
- 语法代码落在独立 feature 内，不把看图进度表和语法表揉成一份超级 state。

## 3. Non-goals（本期）

- 场景图提示的玩法与 Home 入口（数据留空位，有图后再开放）。
- 「识别」游戏（用户标注 vs AI 结果）；槽上的 `role` 仅预留。
- 重组练习（主动↔被动、简单句↔从句等）。
- 真实俄罗斯方块（砖块堆叠、消行）。实现是「一条提示下落 + 按槽填空」。
- 语法内容进入「复习」Tab。
- 账号、真实数据库、报错管理后台、资产 CRUD 页面/接口（内容用静态 JSON + 仓库内 SQL 草案；改内容先直接改 JSON/SQL）。
- 把看图说句和语法抽成同一套「通用卡牌引擎」。

## 4. Users

与 Name Everything 相同：有一定英语基础、需要把规则练成反应，而不是零基础语法课。

界面铬可用中文。学习页展示标杆英文（中文可选）。游戏提示本期只用中文句子，选项为英文成分。

## 5. Information architecture

底部三栏不变：`练习` | `复习` | `我的`。

- **练习** → 练习 Home（不再直接进入看图卡面）。
- **复习** → 仅词汇记忆的 Forgot 队列。
- **我的** → 原有设置与连续天数，并增加语法报错导出。

### 5.1 练习 Home

统一入口，磁贴来自模块注册表（见 §10），不使用顶部分段 Tab。

| 磁贴 | 行为 |
|------|------|
| 词汇记忆 | 进入现有限时回忆循环；**进入该路由后才开始倒计时**。 |
| 语法学习 | 进入章节 → 关卡列表。 |
| 语法游戏 | **至少过一关才可进入。** 一关都没过：磁贴置灰，点击不跳转，提示先去语法学习。 |
| （以后） | 新模块只加一条注册项，不改 Home 布局骨架。 |

场景图不出现在 Home。

### 5.2 语法学习

1. 章节列表：数据驱动。`released = false` 的章可见、锁住、不可点开关卡。
2. 已发布章：关卡按 `sort_order` 由浅入深。**该章第一关默认解锁**；其后每一关必须上一关已过关。不可跳关。
3. 点一关 → **学习页**（标杆句、可点知识点、该关最高分、开始游戏）→ **本关游戏**。
4. 已过关可重打以刷新最高分。

### 5.3 语法游戏

可进入后：历史对局与得分；点开始 → 直接下落填槽。题库 = 所有已过关关卡的 `kind = playable` 句子，混合抽取。命尽结算并写入历史。不负责解锁关卡。

## 6. Learn page

- 标杆句（`sentences.kind = anchor`）始终可见。
- `sentence_spans` 把句中区间标成可点；点开展示对应 `grammar_points`（名称 + 说明）。
- 一条标杆对应多条知识点；一条知识点可被多条例句（标杆和游戏句）引用。
- 展示该关最高分与过关门槛（学习页右上角 icon + `最高分/门槛`）。
- 「开始游戏」进入本关下落局。

## 7. Falling-fill game

学习和语法游戏共用同一引擎，只换题库。每消除或落地一句，先进入**本句结算**（成功/失败、正确答案、下一句、报错 icon），命尽后再进整局结算。

### 7.1 循环

1. 上方出现一条 **中文提示**（`sentence.zh`），向选择区下落。
2. 下方按 `sentence_slots.slot_index` 依次给出该槽的选项（正确项 + distractors，每次出现打乱顺序）。例如先 `{She, It, His, He, Her}`，选对后再出 `{sent, send, sends}`。
3. 全部槽选对：该句消除，得分 +1，下一条立即开始下落。
4. 提示碰到选择区上沿且尚未填完：扣 1 命，本句失败，下一条开始。
5. 选错：不扣命，可当场重选；本次下落加快（剩余时间乘以 `wrong_speed_factor`，可叠加，结果不得短于 `min_fall_duration_ms`）。
6. 生命为 0：本局结束，结算本局消除句数。
7. **每一句**（含开局标杆、含落地失败后的下一句）都从 `fall_duration_ms` 重新计时，不继承上一句被加速后的剩余时间。

### 7.2 题库

| 模式 | 题序 |
|------|------|
| 学习 · 本关 | **第一句固定为该关 `anchor`（入门指导）**；之后只抽该关 `playable`。不得把其他关的句子抽进来。池抽尽则重洗再抽；有不止一句时不连续重复同一句。 |
| 语法游戏 | 只抽已过关关卡的 `playable`。不用任何 `anchor`。池抽尽则重洗；有不止一句时不连续重复同一句。 |

`playable` 的英文全文不得与同关 `anchor` 的英文全文相同。开局标杆若消除，**计入本局得分**，可帮助达到过关门槛。

### 7.3 过关

- 本关最高分 = 历史本关单局消除句数的最大值。
- 最高分 ≥ 该关 `pass_threshold`（缺省则用 `pass_threshold_default`）→ 过关并解锁下一关。
- 默认门槛：3 句。默认生命：3。两者都在 `game_tuning` 中，可被关卡字段覆盖。

### 7.4 可调数字

所有手感数字只来自 `game_tuning`（及关卡覆盖），组件内禁止字面量。至少包括：

| 键 | 默认 | 含义 |
|----|------|------|
| `lives` | 3 | 生命 |
| `pass_threshold_default` | 3 | 过关所需消除句数 |
| `fall_duration_ms` | 8000 | 从出现到落地的基准时长 |
| `wrong_speed_factor` | 0.7 | 选错后剩余时间系数 |
| `min_fall_duration_ms` | 2500 | 加速后剩余时间下限 |

关卡可覆盖 `lives`、`fall_duration_ms`、`pass_threshold`。以后按难度微调只改配置或 JSON，不改引擎公式入口。

## 8. Content model

静态 JSON 与日后 SQL 同形。章节划分只存在数据里：改 `sort_order`、增删 `chapters` / `levels` 即可重新设计目录，不必改 UI 代码。

### 8.1 Tables

**chapters**

| Column | Notes |
|--------|--------|
| `id` | Stable id |
| `title_zh` | 列表展示 |
| `description_zh` | 可选 |
| `sort_order` | 升序 |
| `released` | `false`：可见但整章锁住 |

**levels**

| Column | Notes |
|--------|--------|
| `id` | Stable id |
| `chapter_id` | FK |
| `sort_order` | 章内由浅入深 |
| `grammar_point_id` | 该关对应的一个大知识点（列表主标题） |
| `pass_threshold` | 可空 → 用全局默认 |
| `lives` | 可空 → 用全局默认 |
| `fall_duration_ms` | 可空 → 用全局默认 |

**grammar_points**

| Column | Notes |
|--------|--------|
| `id` | Stable id |
| `title_zh` | 知识点名 |
| `body_zh` | 说明 |

**sentences**

标杆与游戏句同一张表。

| Column | Notes |
|--------|--------|
| `id` | Stable id |
| `level_id` | FK |
| `kind` | `anchor` \| `playable` |
| `en` | 正确英文全文 |
| `zh` | 游戏下落用的中文提示；标杆也可有中文 |
| `prompt_kind` | `zh` \| `image`。本期只用 `zh` |
| `image_url` | 可空。场景图预留 |
| `sort_order` | `playable` 抽题时可作权重/顺序 |

约束：每个 `level_id` 恰好一条 `kind = anchor`。`playable.en` ≠ 同关 `anchor.en`。

**sentence_spans**

| Column | Notes |
|--------|--------|
| `id` | Stable id |
| `sentence_id` | 标杆或游戏句 |
| `grammar_point_id` | FK |
| `start` / `end` | 落在 `en` 上的半开区间（Unicode code unit 与实现一致即可，规格要求同一套偏移） |

标杆 **必须** 至少有一条 span（学习页要点）。游戏句 span **选填**：有则用于报错定位和后期识别；无则该句继承本关标杆所关联的知识点集合。

**sentence_slots**

| Column | Notes |
|--------|--------|
| `id` | Stable id |
| `sentence_id` | FK |
| `slot_index` | 选择顺序，从 0 |
| `role` | 如 `S` `V` `O` `IO` `C` `A`。本期游戏不展示；给识别预留 |
| `correct` | 正确选项文本 |
| `distractors` | 字符串数组 |

`anchor` 与 `playable` **都必须** 有 slots（标杆要能当开局指导）。

**game_tuning**

键值表（JSON 对象即可）：见 §7.4。

**asset_reports**（本期本机，导出同形）

| Column | Notes |
|--------|--------|
| `id` | 本机生成 |
| `asset_type` | `sentence` \| `grammar_point` \| `sentence_slot` |
| `asset_id` | |
| `level_id` | 可空，便于对照 |
| `note` | 可空备注 |
| `created_at` | ISO-8601 |

### 8.2 Week-1 pack

- 章节目录搭全（至少包括：简单句、谓语、非谓语；具体标题以 JSON 为准，代码不写死这些名字）。
- 仅第一章 `released = true`，且至少 2 关；每关 1 条 `anchor` + 至少 3 条 `playable`（默认可在一局内过关）。
- 其余章 `released = false`，可以没有关卡行。

### 8.3 Local progress（非课程资产）

键与看图进度分离，见 §10.3。至少包含：

- 各关最高分、是否过关
- 语法游戏对局历史（时间、消除句数、是否完成结算）
- `asset_reports` 列表

## 9. Reports and export

无账号、不入库、无审核 UI。

**入口**

- 学习页：知识点卡片右上角小 icon；标杆句不再单独设入口。
- 游戏中：每句结束后的中间结算页右上角 icon。
- 结算页（整局）：不再设报错入口。

点击 icon 打开 `<dialog>`，可填写可选备注后提交。不占整行。

**导出（我的）**

- 「导出语法报错」：下载 JSON，并支持复制到剪贴板。
- 字段与 `asset_reports` 一致。
- 导出后记录仍保留；另提供「清空已导出」以免重复堆积。清空只影响本机报错列表，不影响关卡进度。

## 10. Code architecture

实现语法前先按功能竖切，避免在现有 `PracticePage` / `storage.ts` 上堆第二种循环。

```
src/
  shell/                 路由、BottomNav、练习 Home
  shared/                布局、按钮、视觉 token；不含业务规则
  features/pictures/     现有看图说句（页、卡、deck、progress/v1）
  features/grammar/      课程包、解锁、下落引擎、报错、本模块存储
  features/me/           设置页；只调用各模块公开门面
```

### 10.1 Rules

1. **Home 是注册表，不是大 if。** 每个练习模块提交磁贴：`id`、标题、路由、`available(progress)`、不可用时的提示文案。语法游戏在 `passedLevelCount === 0` 时 `available = false`；Home 置灰并 toast/文案提示去语法学习，**不导航**。
2. **禁止跨 feature 引用内部文件。** `pictures` 不 import 语法引擎；`grammar` 不 import 看图 `Card` / `deck` / `progress/v1`。壳只依赖各模块公开入口。
3. **存储分键。** 看图继续 `name-everything/progress/v1`。语法使用 `grammar/progress/v1` 与 `grammar/reports/v1`。禁止合并成一个超级 `ProgressState`。
4. **引擎与 UI 分离。** 下落、命、加速、消除、结算是纯函数，读取 `game_tuning`；页面只渲染和把点击送进引擎。
5. **Me 不解析课程表。** 报错导出走 `exportReports()` 之类门面。
6. **不抽伪通用卡牌引擎。** 看图倒计时与语法填槽只共享 shell 与 token。
7. **先把现有练习挪到 `features/pictures`，行为不变，再接语法。**

### 10.2 Routes

| Path | Screen |
|------|--------|
| `/` | 练习 Home |
| `/practice/pictures` | 看图说句（现 `PracticePage`） |
| `/practice/grammar/learn` | 章节与关卡列表 |
| `/practice/grammar/learn/:levelId` | 学习页 |
| `/practice/grammar/learn/:levelId/play` | 本关游戏 |
| `/practice/grammar/play` | 语法游戏（未过关访问时重定向回 Home） |
| `/review` | 看图复习 |
| `/me` | 我的 |

深链接进未解锁关卡：回到该章列表，不开始游戏。

### 10.3 Data flow

- 课程：打包进仓库的 grammar JSON；启动时只读。
- 调参：`game_tuning` JSON，引擎注入，不写死在组件。
- 进度与报错：本机；语法键与看图键分离。
- 仓库内附 `schema.sql`（与 §8.1 同形），本期不执行、不连接。

## 11. Testing

必须覆盖：

- Home：未过关时语法游戏置灰、点击不导航。
- 过关门槛与下一关解锁；不可跳关。
- 每关恰好一条 `anchor`；`playable.en` 与标杆不同。
- 学习局第一句为 `anchor`，之后为该关 `playable`。
- 语法游戏题库不含 `anchor`，且不含未过关关卡。
- 落地扣命、选错加速且不低于下限、命尽结算最高分。
- 报错导出 JSON 字段与 `asset_reports` 一致。
- `pictures` 与 `grammar` 的存储互不覆盖。

看图说句在路由搬家后：进入 `/practice/pictures` 才倒计时；从 Home 返回不丢该模块进度。

## 12. Later

1. **场景图：** `prompt_kind = image` + `image_url`；Home 或关卡内再开提示选项。引擎仍是下落填槽，只换提示介质。
2. **识别：** 对任意 `sentence` 标注成分，与槽 `role` 或日后 AI 结果对比。本期只保证 `role` 与可选 spans 存在。
3. **入库：** JSON 原样进 SQL；报错导出可插入 `asset_reports`。资产 CRUD 仍可先 SQL。
4. **重组：** 新题型，不塞进本期填槽。

## 13. Approval record

| Topic | Decision |
|-------|----------|
| Scope | 学习 + 替换填槽 + 目录占位 + 表结构 + 本机报错导出。场景图与识别不做玩法 |
| Entry | 练习 Home 磁贴，不用顶 Tab |
| Grammar game tile | 未过关置灰，点击提示去学习，不进页 |
| Unlock | 该关最高分 ≥ 门槛（默认 3 句） |
| Learn vs arcade | 学习：关卡线性 + 学习页；游戏：已过关 playable 混合 |
| Anchor in game | 仅作本关第一句指导；混合局不用 |
| Sentence tables | 合并为 `sentences.kind` |
| Storage | 静态 JSON；报错本机可导出 |
| Tuning | 独立配置，禁止魔法数 |
| Code | `shell` / `shared` / `features/{pictures,grammar,me}` |
| Pack | 目录搭全，仅第一章 `released` |
