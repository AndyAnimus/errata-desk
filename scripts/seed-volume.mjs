import {readFileSync} from 'node:fs'
import {ANNOUNCEMENTS, WORKED, expandClaims} from './volume-data.mjs'

const projectId = 'gsu7qzk9'
const dataset = 'production'
const token = readFileSync(new URL('../secrets/sanity.env', import.meta.url), 'utf8')
  .split('\n')
  .find((l) => l.startsWith('SANITY_API_TOKEN='))
  .slice('SANITY_API_TOKEN='.length)

function stripNulls(doc) {
  const out = {}
  for (const [k, v] of Object.entries(doc)) {
    if (v != null && v !== '') out[k] = v
  }
  return out
}

const sources = ANNOUNCEMENTS.map((ann) =>
  stripNulls({
    _id: `source-br-${ann.id}`,
    _type: 'sourceDoc',
    title: ann.title,
    sourceUrl: ann.url,
    publishedAt: ann.publishedAt,
    author: ann.author,
    language: 'en',
    about: [ann.id, 'banned-and-restricted'],
    excerpt: ann.excerpt,
  }),
)

const changes = ANNOUNCEMENTS.map((ann) => ({
  _id: `rules-change-${ann.id}`,
  _type: 'rulesChange',
  title: ann.title,
  subject: `br-${ann.id}`,
  sourceUrl: ann.url,
  clocks: Object.entries(ann.clocks).map(([platform, switchesOn]) => ({
    _key: platform,
    platform,
    switchesOn,
  })),
}))

const claims = expandClaims().map(stripNulls)

const mutations = [
  ...sources.map((doc) => ({createOrReplace: doc})),
  ...changes.map((doc) => ({createOrReplace: doc})),
  ...claims.map((doc) => ({createOrReplace: doc})),
  ...WORKED.map((doc) => ({createOrReplace: doc})),
  {
    patch: {
      id: 'errata-desk-context',
      set: {
        instructions: `Answer Magic rules and Standard legality questions that depend on platform clocks.

Clocks are the dates printed on the Wizards Banned and Restricted announcement, not one global day.

June 1 2020 Ian Duke announcement:
- companion procedure: tabletop 2020-06-01, Magic Online 2020-06-03, Arena 2020-06-04
- Standard bans (Fires of Invention, Agent of Treachery): tabletop and Magic Online 2020-06-01, Arena 2020-06-04

Later announcements in this lake, each with its own printed clocks:
- 2020-03-09 tabletop/Magic Online March 10, Arena March 12
- 2020-05-18 tabletop/Magic Online May 18, Arena May 21
- 2020-07-13 tabletop/Magic Online July 13, Arena July 16
- 2020-08-03, 2020-09-28, 2020-10-12: one effective date for every platform the page names

Historic and Brawl claims are Arena-only. Pioneer, Modern, Legacy, Vintage, and Pauper claims are tabletop and Magic Online only. Do not invent a platform the announcement does not name.

"N days before X switched" uses that platform's clock minus N.

Check standing rulings before deriving. Word overlap is not current.

If the ask is in French, German, or Spanish, prefer valueFr / valueDe / valueEs on the claim when present.

For primary quotes, read sourceDoc documents or the errata-sources MCP. Do not invent a ban, a date, or a quote.`,
      },
    },
  },
]

async function mutate(chunk) {
  const res = await fetch(`https://${projectId}.api.sanity.io/v2021-06-07/data/mutate/${dataset}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({mutations: chunk}),
  })
  const body = await res.text()
  if (!res.ok) {
    console.error(body.slice(0, 800))
    process.exit(1)
  }
}

for (let i = 0; i < mutations.length; i += 40) {
  await mutate(mutations.slice(i, i + 40))
  console.log('wrote', Math.min(i + 40, mutations.length), '/', mutations.length)
}

console.log('sources', sources.length, 'changes', changes.length, 'claims', claims.length, 'calls', WORKED.length)
