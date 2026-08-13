import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const CDN = 'https://ali.bczcdn.com/r/'
const SOURCE_DIR = 'E:/Workspace-Web/my_app/assets/data/words/cet4-all'
const OUTPUT = 'src/content/t1-cards.json'

const TAGS_BY_ID = {
  ladder: ['home'],
  boot: ['home'],
  bowl: ['home'],
  spoon: ['home'],
  plate: ['home'],
  basin: ['home'],
  couch: ['home'],
  curtain: ['home'],
  glue: ['home'],
  mirror: ['home'],
  laptop: ['home'],
  keyboard: ['home'],
  cap: ['home'],
  diary: ['home'],
  airplane: ['street'],
  garage: ['street'],
  gym: ['street'],
  clinic: ['street'],
  museum: ['street'],
  grocery: ['street'],
  motel: ['street'],
  dock: ['street'],
  harbor: ['street'],
  jet: ['street'],
  bank: ['street'],
  gate: ['street'],
  cabin: ['street'],
  corridor: ['street'],
  ingredient: ['food'],
  dish: ['food'],
  barbecue: ['food'],
  harvest: ['food'],
  lung: ['body'],
  bear: ['body'],
  nest: ['body'],
  branch: ['body'],
  log: ['body'],
  ocean: ['body'],
  trail: ['body'],
  bench: ['body'],
}

function unescapeSentence(sentence) {
  return sentence
    .replace(/\\u0027/g, "'")
    .replace(/\\'/g, "'")
}

function parseZh(meanCn) {
  if (!meanCn) return undefined
  let text = meanCn.replace(/^n\./, '')
  const split = text.split(/[；，;]/)
  text = split[0].trim()
  return text || undefined
}

const cards = Object.entries(TAGS_BY_ID).map(([id, tags]) => {
  const path = join(SOURCE_DIR, `${id}.json`)
  const raw = JSON.parse(readFileSync(path, 'utf8'))

  const card = {
    id,
    word: raw.word,
    sentence: unescapeSentence(raw.sentence),
    image: CDN + raw.image_file,
    imageSource: 'baicizhan',
    tags,
    tier: 'T1',
    wordAudio: CDN + raw.word_audio,
    sentenceAudio: CDN + raw.sentence_audio,
  }

  const zh = parseZh(raw.mean_cn)
  if (zh) card.zh = zh

  return card
})

writeFileSync(OUTPUT, JSON.stringify(cards, null, 2) + '\n')
console.log(`Wrote ${cards.length} cards to ${OUTPUT}`)
