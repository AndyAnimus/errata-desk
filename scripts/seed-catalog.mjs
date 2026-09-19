import {readFileSync} from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../secrets/sanity.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i), l.slice(i + 1)]
    }),
)

const projectId = env.SANITY_PROJECT_ID
const dataset = env.SANITY_DATASET
const token = env.SANITY_API_TOKEN

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72)
}

const cards = JSON.parse(readFileSync('/tmp/comp-slim.json', 'utf8'))
const rulings = JSON.parse(readFileSync('/tmp/comp-rulings.json', 'utf8'))

const docs = [
  ...cards.map((c) => ({
    _id: `companion-${slug(c.name)}`,
    _type: 'companionCard',
    name: c.name,
    manaCost: c.mana || '',
    typeLine: c.type || '',
    oracleText: c.oracle || '',
    imageUrl: c.image,
    scryfallUrl: c.scryfall,
    setName: c.set || '',
  })),
  ...rulings.map((r, i) => ({
    _id: `card-ruling-${slug(r.card)}-${i}`,
    _type: 'cardRuling',
    cardName: r.card,
    publishedAt: r.date,
    comment: r.comment,
    source: r.source || 'scryfall',
    scryfallId: r.scryfallId,
  })),
]

async function mutate(mutations) {
  const res = await fetch(`https://${projectId}.api.sanity.io/v2021-06-07/data/mutate/${dataset}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({mutations}),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(body.slice(0, 400))
  }
}

const chunk = 25
for (let i = 0; i < docs.length; i += chunk) {
  const slice = docs.slice(i, i + chunk)
  await mutate(slice.map((doc) => ({createOrReplace: doc})))
  console.log('wrote', i + slice.length, '/', docs.length)
}

await mutate([
  {
    patch: {
      id: 'errata-desk-context',
      set: {
        groqFilter:
          '_type in ["rulesClaim", "ruling", "rulesChange", "companionCard", "cardRuling"]',
      },
    },
  },
])
console.log('catalog', docs.length, 'docs')
