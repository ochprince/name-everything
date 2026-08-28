"""
Generate src/features/pictures/content/wordPriority.ts for name-everything.

Reads baicizhan cet4_core JSON (word + mean_cn) and wordfreq zipf scores,
emits a compact static map: word -> [posRank, zipf] where posRank follows
the user-approved learning priority (口语速成/二语习得):

  动词 > 名词 > 代词&冠词 > 介词 > 形容词 > 副词 > 其他

Usage: uv run --with wordfreq python scripts/generate-word-priority.py
"""
import json
import os
import re
from pathlib import Path

from wordfreq import zipf_frequency

SOURCE = Path('/data/english_bot_resources/baicizhan/cet4_core')
OUT = Path('/data/name-everything/src/features/pictures/content/wordPriority.ts')

# 优先级：越小越先学（用户定案）
POS_RANK = {
    'v': 0,      # 动词：句子骨架
    'n': 1,      # 名词：语义内容
    'pron': 2,   # 代词&冠词：造句必备功能词
    'art': 2,
    'prep': 3,   # 介词：词间逻辑关系
    'adj': 4,    # 形容词：修饰成分
    'adv': 5,    # 副词：锦上添花
    'conj': 6,
    'num': 6,
    'int': 6,
    'aux': 6,
}
UNKNOWN_RANK = 7

POS_RE = re.compile(r'\b(n|v|adj|adv|prep|pron|art|conj|num|int|aux)\.')


def pos_rank(mean_cn: str) -> int:
    """取 mean_cn 中最高优先级的词性（兼类词如 v./n. → 动词）。"""
    matches = set(POS_RE.findall(mean_cn or ''))
    if not matches:
        return UNKNOWN_RANK
    return min(POS_RANK.get(m, UNKNOWN_RANK) for m in matches)


def main() -> None:
    entries = []
    for f in sorted(os.listdir(SOURCE)):
        if not f.endswith('.json'):
            continue
        word = f[:-5]
        data = json.load(open(SOURCE / f))
        rank = pos_rank(str(data.get('mean_cn') or ''))
        zipf = round(zipf_frequency(word, 'en'), 2)
        entries.append((word, rank, zipf))

    lines = [
        '// 自动生成，勿手改。来源：baicizhan cet4_core + wordfreq zipf。',
        '// 生成命令：uv run --with wordfreq python scripts/generate-word-priority.py',
        '// 排序键 = [词性优先级, zipf 词频]：动词>名词>代词&冠词>介词>形容词>副词，',
        '// 同词性内按词频降序（用户定案：口语速成/二语习得，仅影响词汇记忆模块）。',
        'export const WORD_PRIORITY: Record<string, [number, number]> = {',
    ]
    for word, rank, zipf in sorted(entries):
        lines.append(f'  {json.dumps(word)}: [{rank}, {zipf}],')
    lines.append('}')
    lines.append('')
    OUT.write_text('\n'.join(lines))
    print(f'wrote {len(entries)} words -> {OUT}')

    from collections import Counter
    dist = Counter(r for _, r, _ in entries)
    print('pos rank distribution:', dict(sorted(dist.items())))


if __name__ == '__main__':
    main()
