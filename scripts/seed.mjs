import { readFileSync } from 'node:fs'

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
const src =
  'https://magic.wizards.com/en/news/announcements/june-1-2020-banned-and-restricted-announcement'
const srcTitle = 'June 1, 2020 Banned and Restricted Announcement'
const newRule =
  'Once per game, any time you could cast a sorcery (during your main phase when the stack is empty), you can pay 3 generic mana to put your companion from your sideboard into your hand. This is a special action, not an activated ability.'
const oldRule =
  'If this card is your chosen companion, you may cast it once from outside the game.'

const claims = [
  {
    _id: 'claim-tabletop-old',
    platform: 'tabletop',
    status: 'superseded',
    effectiveFrom: '2020-04-24',
    effectiveUntil: '2020-06-01',
    value: 'Cast the companion once from outside the game. No extra generic cost.',
    quote: oldRule,
    sourceTitle: 'Printed Ikoria companion reminder (replaced by the June 1, 2020 rules change)',
    sourceUrl: src,
  },
  {
    _id: 'claim-tabletop-current',
    platform: 'tabletop',
    status: 'current',
    effectiveFrom: '2020-06-01',
    value: 'Pay 3 generic mana to put the companion into your hand, then cast it.',
    quote: newRule,
    sourceTitle: srcTitle + ' — Tabletop Effective Date: June 1, 2020',
    sourceUrl: src,
  },
  {
    _id: 'claim-arena-old',
    platform: 'arena',
    status: 'superseded',
    effectiveFrom: '2020-04-24',
    effectiveUntil: '2020-06-04',
    value: 'Cast the companion once from outside the game. No extra generic cost.',
    quote: oldRule,
    sourceTitle: 'Pre-change Arena procedure, ended by the Arena effective date in the June 1 announcement',
    sourceUrl: src,
  },
  {
    _id: 'claim-arena-current',
    platform: 'arena',
    status: 'current',
    effectiveFrom: '2020-06-04',
    value: 'Pay 3 generic mana to put the companion into your hand, then cast it.',
    quote: newRule,
    sourceTitle: srcTitle + ' — MTG Arena Companion Rules Effective Date: June 4, 2020',
    sourceUrl: src,
  },
  {
    _id: 'claim-mtgo-old',
    platform: 'mtgo',
    status: 'superseded',
    effectiveFrom: '2020-04-24',
    effectiveUntil: '2020-06-03',
    value: 'Cast the companion once from outside the game. No extra generic cost.',
    quote: oldRule,
    sourceTitle: 'Pre-change Magic Online procedure',
    sourceUrl: src,
  },
  {
    _id: 'claim-mtgo-current',
    platform: 'mtgo',
    status: 'current',
    effectiveFrom: '2020-06-03',
    value: 'Pay 3 generic mana to put the companion into your hand, then cast it.',
    quote: newRule,
    sourceTitle: srcTitle + ' — Magic Online Companion Rules Update Effective Date: June 3, 2020',
    sourceUrl: src,
  },
].map((c) => ({
  _type: 'rulesClaim',
  game: 'Magic: The Gathering',
  subject: 'companion',
  predicate: 'bringIntoGame',
  ...c,
}))

const change = {
  _id: 'rules-change-companion',
  _type: 'rulesChange',
  title: 'Companion procedure, June 1 2020',
  subject: 'companion',
  sourceUrl: src,
  clocks: [
    {_key: 'tabletop', platform: 'tabletop', switchesOn: '2020-06-01'},
    {_key: 'mtgo', platform: 'mtgo', switchesOn: '2020-06-03'},
    {_key: 'arena', platform: 'arena', switchesOn: '2020-06-04'},
  ],
}

const instructions = `Answer only how a Magic companion enters the game.

Clocks, all 2020, also stored on rules-change-companion.clocks: tabletop 2020-06-01, Magic Online 2020-06-03, Arena 2020-06-04. "N days before X switched" is that clock minus N days. Read the clocks with array_field_reader on document rules-change-companion, field clocks. Do not invent a fourth date.

Check a standing ruling before you derive one:
*[_type=="ruling" && platform=="<platform>" && date=="<YYYY-MM-DD>"][0]{value,claimId,sourceUrl,reading}

If that document exists, it is the answer. Do not guess again.

Otherwise the only in-force rows are:
*[_type=="rulesClaim" && platform=="<platform>" && predicate=="bringIntoGame" && effectiveFrom <= "<YYYY-MM-DD>" && (!defined(effectiveUntil) || effectiveUntil > "<YYYY-MM-DD>")]{status,value,quote,effectiveFrom,effectiveUntil,sourceTitle,sourceUrl}

Word overlap is not current. If nothing covers that platform and day, say the desk does not cover it.`

const res = await fetch(
  `https://${projectId}.api.sanity.io/v2021-06-07/data/mutate/${dataset}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mutations: [
        ...claims.map((doc) => ({createOrReplace: doc})),
        {createOrReplace: change},
        {
          patch: {
            id: 'errata-desk-context',
            set: {
              instructions,
              groqFilter: '_type in ["rulesClaim", "ruling", "rulesChange"]',
            },
          },
        },
      ],
    }),
  },
)
const body = await res.text()
if (!res.ok) {
  console.error(body.slice(0, 500))
  process.exit(1)
}
console.log('seeded', claims.length, 'claims')
