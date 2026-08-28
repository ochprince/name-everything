"""
Generate a Supabase migration that reorders picture_words.sort_order by the
user-approved learning priority (词性优先级 + 词频), so incremental batches
(fetched by sort_order) match the full-catalog ordering (WORD_PRIORITY).

Reads baicizhan cet4_core JSON (word + mean_cn) and wordfreq zipf scores —
same source as scripts/generate-word-priority.py. Dominant POS from Brown
corpus decides the group for multi-POS words (user decision 2026-08-28).

Sort key: [posRank, -zipf(round 2), word] — must match hydratePictureWords
(WORD_PRIORITY rank asc, zipf desc; stable sort keeps word order on ties).

Usage: uv run --with wordfreq --with nltk python scripts/generate-sort-order-migration.py
"""
import json
import os
import re
from pathlib import Path

from wordfreq import zipf_frequency
from nltk.corpus import brown

SOURCE = Path('/data/english_bot_resources/baicizhan/cet4_core')
OUT = Path('/data/name-everything/supabase/migrations/20260828150000_reorder_picture_words_by_dominant_pos.sql')

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

BROWN_TO_POS = {
    'VERB': 'v',
    'NOUN': 'n',
    'PRON': 'pron',
    'DET': 'art',
    'ADP': 'prep',
    'ADJ': 'adj',
    'ADV': 'adv',
    'CONJ': 'conj',
    'NUM': 'num',
    'X': 'int',
}


def pos_rank(mean_cn: str) -> int:
    matches = set(POS_RE.findall(mean_cn or ''))
    if not matches:
        return UNKNOWN_RANK
    return min(POS_RANK.get(m, UNKNOWN_RANK) for m in matches)


def main() -> None:
    # 预构建 Brown 词性频率表（一次遍历）
    from collections import Counter, defaultdict
    pos_freq: dict[str, Counter[str]] = defaultdict(Counter)
    for w, tag in brown.tagged_words(tagset='universal'):
        pos_freq[w.lower()][tag] += 1

    def dominant_rank(word: str, mean_cn: str) -> int:
        counter = pos_freq.get(word)
        if counter:
            pos = BROWN_TO_POS.get(counter.most_common(1)[0][0])
            if pos:
                return POS_RANK[pos]
        return pos_rank(mean_cn)

    entries = []
    for f in sorted(os.listdir(SOURCE)):
        if not f.endswith('.json'):
            continue
        word = f[:-5]
        data = json.load(open(SOURCE / f))
        mean_cn = str(data.get('mean_cn') or '')
        rank = dominant_rank(word, mean_cn)
        zipf = round(zipf_frequency(word, 'en'), 2)
        entries.append((word, rank, zipf))

    # 排序键与前端 hydratePictureWords 一致：rank asc → zipf desc → word asc（tie 稳定）
    ordered = sorted(entries, key=lambda e: (e[1], -e[2], e[0]))
    assert len(ordered) == len({w for w, _, _ in ordered})
    print(f'{len(ordered)} words; rank dist:')
    from collections import Counter
    print(dict(sorted(Counter(r for _, r, _ in ordered).items())))

    lines = [
        '-- 重排 picture_words.sort_order：按主导词性优先级（动词>名词>代词&冠词>介词>形容词>副词）',
        '-- + 同词性内词频降序（wordfreq zipf）。与前端 hydratePictureWords / WORD_PRIORITY 一致，',
        '-- 使增量批次（按 sort_order 拉取）与全量目录排序统一。',
        '-- 兼类词（forward/even 等多词性）按 Brown 语料中实际最高频的词性归组，',
        '-- 如 forward 84% 副词 → 副词组；even 95% 副词 → 副词组。',
        '-- 自动生成：uv run --with wordfreq --with nltk python scripts/generate-sort-order-migration.py',
        '-- 触发器 trg_picture_words_bump_version 会自动 bump content_table_versions，客户端自动刷新。',
        'BEGIN;',
        '',
        '-- 先全部转负数，避免唯一约束在逐步更新时冲突',
        'UPDATE picture_words SET sort_order = -sort_order - 1;',
        '',
        '-- 按新顺序写入（0..N-1）',
        'UPDATE picture_words AS pw SET sort_order = v.new_sort',
        'FROM (VALUES',
    ]
    for i, (word, _rank, _zipf) in enumerate(ordered):
        comma = ',' if i < len(ordered) - 1 else ''
        # 注意：PostgreSQL 字符串字面量用单引号（json.dumps 是双引号，会被当标识符）
        escaped = word.replace("'", "''")
        lines.append(f"  ('{escaped}', {i}){comma}")
    lines += [
        ') AS v(word, new_sort)',
        'WHERE pw.word = v.word;',
        '',
        'COMMIT;',
        '',
    ]
    OUT.write_text('\n'.join(lines))
    print(f'wrote {OUT}')


if __name__ == '__main__':
    main()
