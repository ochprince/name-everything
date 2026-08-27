# Favicon 设计：N + 天幕色场

**日期：** 2026-08-27  
**状态：** 已批准（用户确认方案 1，构图与文件改动均认可，并要求直接实现）

## 目标

替换 Vite 默认 `vite.svg` favicon，换成 Name Everything 自有品牌标，在浏览器标签页可辨识。

## 决策

- **符号：** 单字母 `N`（非 `NE`）
- **底：** 纯 cobalt `#002FA7`（蓝白调；无 cyc / rose）
- **实现：** 单一手绘 SVG（方案 1）；不提供 `.ico` / apple-touch

## 视觉规格

| 项 | 值 |
| --- | --- |
| 格式 | SVG，`viewBox="0 0 32 32"` |
| 外形 | 圆角矩形，`rx=6` |
| 底板 | `#002FA7`（cobalt） |
| 字母 | 居中白色几何粗体 `N`（path，不嵌字体） |
| 禁止 | 描边、阴影、渐变噪点、多色字母 |

## 文件改动

| 动作 | 路径 |
| --- | --- |
| 新增 | `public/favicon.svg` |
| 修改 | `index.html` icon link → `/favicon.svg` |
| 删除 | `public/vite.svg` |
| 可选 | `MANIFEST.md` 补一句站点 favicon 说明 |
| 不做 | README（非用户可见功能说明）、`.ico`、apple-touch |

## 验收

- 本地 `npm run dev` 打开，标签页显示 N + 三色场标，不再是 Vite 闪电标。
- 构建产物中无 `vite.svg` 作为 favicon。
