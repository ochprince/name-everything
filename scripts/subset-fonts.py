"""
Subset Noto Sans SC to the characters actually used by name-everything.

Sources of CJK text:
- src/ source files (UI copy, labels)
- baicizhan word data (mean_cn, sentence_trans)
- grammar pack content (supabase migrations zh fields + local JSON fallback)

Output: public/fonts/noto-sans-sc-subset-{500,600,700}.woff2 (~150-300KB each
vs 1.16MB full Chinese subset). Fallback chain keeps system CJK fonts for any
character missed (subsets always render, worst case falls back to system font).

Usage: uv run --with fonttools python scripts/subset-fonts.py
"""
import os
import re
from pathlib import Path

from fontTools import subset

ROOT = Path('/data/name-everything')
FONT_DIR = Path('/data/name-everything/node_modules/@fontsource/noto-sans-sc/files')
# 放 src/assets/fonts：CSS 用相对路径 url() 引用，Vite 构建自动加 hash + base 前缀
# （public/ 下绝对路径 /fonts/... 在 GitHub Pages 子路径会 404）
OUT_DIR = ROOT / 'src' / 'assets' / 'fonts'
OUT_DIR.mkdir(parents=True, exist_ok=True)

WEIGHTS = {'500': '500', '600': '600', '700': '700'}

# 源字体文件名模板（@fontsource 包内）
def src_font(weight: str) -> Path:
    # 形如 noto-sans-sc-chinese-simplified-500-normal.woff2
    return FONT_DIR / f'noto-sans-sc-chinese-simplified-{weight}-normal.woff2'


def collect_cjk_text() -> set[str]:
    chars: set[str] = set()
    # 1. src/ 全部源码（UI 文案、提示、按钮）
    for p in (ROOT / 'src').rglob('*'):
        if p.suffix in ('.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html'):
            try:
                chars.update(p.read_text(encoding='utf-8'))
            except (UnicodeDecodeError, OSError):
                pass
    # 2. 词库数据（本地 JSON 快照）
    for p in Path('/data/english_bot_resources/baicizhan').rglob('*.json'):
        try:
            chars.update(p.read_text(encoding='utf-8'))
        except (UnicodeDecodeError, OSError):
            pass
    # 3. 语法内容（migrations SQL + 本地 JSON fallback）
    for p in (ROOT / 'supabase' / 'migrations').rglob('*.sql'):
        try:
            chars.update(p.read_text(encoding='utf-8'))
        except (UnicodeDecodeError, OSError):
            pass
    for p in (ROOT / 'src' / 'features' / 'grammar' / 'content').rglob('*.json'):
        try:
            chars.update(p.read_text(encoding='utf-8'))
        except (UnicodeDecodeError, OSError):
            pass
    return chars


def subset_font(weight: str, text: str) -> Path:
    src = src_font(weight)
    out = OUT_DIR / f'noto-sans-sc-subset-{weight}.woff2'
    options = subset.Options(
        flavor='woff2',
        layout_features=['*'],
        hinting=False,
        desubroutinize=True,
    )
    subsetter = subset.Subsetter(options=options)
    font = subset.load_font(str(src), options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    subset.save_font(font, str(out), options)
    return out


def main() -> None:
    text = ''.join(collect_cjk_text())
    # 兜底字符：ASCII 可打印 + 常用中文标点（子集未覆盖时系统字体兜底）
    ascii_chars = ''.join(chr(c) for c in range(32, 127))
    extra_punct = '，。！？；：、（）“”‘’《》【】—…·％￥'
    text = ascii_chars + extra_punct + text
    print(f'collected {len(text)} unique chars')
    for weight in WEIGHTS:
        out = subset_font(weight, text)
        kb = out.stat().st_size / 1024
        print(f'weight {weight}: {out.name} {kb:.0f}KB')


if __name__ == '__main__':
    main()
