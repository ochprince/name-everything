# Name Everything

看见一个东西，说出那句英文。面向手机的练习循环：一张图、一段思考倒计时，然后 Find it / Forgot / Got it。

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

## 第一周范围外

- 长尾卡片的 AI 生成
- 拍照 / 识图模式
- Capacitor 原生壳或上架应用商店
- 跟读录音与发音打分
- 60 秒生活场景限时挑战
- 正式产品命名与品牌打磨
- 多设备账号与同步
- 正式间隔重复（SRS）调度
- 把百词斩的 jpeg / mp3 二进制拷进本仓库

## 重新生成 T1 卡片

在仓库根目录执行（需要同级目录中有 `my_app`，且含 `assets/data/words/cet4-all`）：

```bash
node scripts/build-t1-pack.mjs
```

会写入 `src/content/t1-cards.json`（图片与音频为 CDN 地址）。

## 媒体说明

卡片图片与音频通过百词斩 CDN（`https://ali.bczcdn.com/r/…`）热链，仅用于练习接线。权属与下架说明见上方 **Disclaimer**。不要把当前词包当长期产品素材；商业化或上架前请换成已获授权的媒体。

## 第一周验证清单

本地执行 `npm run dev` 后做冒烟检查（完成后关掉开发服）：

- [ ] **练习** — 可见图片；cue 区为倒计时；Find it 前单词 / 句子隐藏；超时亮答案、复习计数 +1，等 Next 再切下一张
- [ ] Find it 后出单词和例句；Forgot / Got it 立即生效
- [ ] 一组 10 次练习 Got it 后出现「今日已完成」；继续可再来一组
- [ ] **复习** — Forgot 列表随操作更新；打开即出图+词+句
- [ ] **我的** — 今日数量、连续天数、思考时长会持久化
- [ ] 手机视口可用（单列、点击区域够大）
