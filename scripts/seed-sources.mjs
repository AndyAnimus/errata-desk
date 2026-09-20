import {readFileSync} from 'node:fs'

const projectId = 'gsu7qzk9'
const dataset = 'production'
const token = readFileSync(new URL('../secrets/sanity.env', import.meta.url), 'utf8')
  .split('\n')
  .find((l) => l.startsWith('SANITY_API_TOKEN='))
  .slice('SANITY_API_TOKEN='.length)

const SRC =
  'https://magic.wizards.com/en/news/announcements/june-1-2020-banned-and-restricted-announcement'
const TITLE = 'June 1, 2020, Banned and Restricted Announcement'

const companionOld = {
  en: 'Cast the companion once from outside the game. No extra generic cost.',
  fr: 'Jouez le compagnon une fois depuis l’extérieur de la partie. Pas de coût générique supplémentaire.',
  de: 'Spiele den Gefährten einmal von außerhalb des Spiels. Keine zusätzlichen generischen Mana-Kosten.',
  es: 'Lanza el compañero una vez desde fuera del juego. Sin coste genérico extra.',
}
const companionNew = {
  en: 'Pay 3 generic mana to put the companion into your hand, then cast it.',
  fr: 'Payez 3 manas génériques pour mettre le compagnon dans votre main, puis jouez-le.',
  de: 'Bezahle 3 generisches Mana, um den Gefährten auf die Hand zu nehmen, und spiele ihn dann.',
  es: 'Paga 3 de maná genérico para poner el compañero en tu mano y luego lánzalo.',
}

const sources = [
  {
    _id: 'source-br-2020-06-01-companion',
    _type: 'sourceDoc',
    title: `${TITLE} — companion rule`,
    sourceUrl: SRC,
    publishedAt: '2020-06-01',
    author: 'Ian Duke',
    language: 'en',
    about: ['companion', 'clocks'],
    excerpt: `New Companion Rule: Once per game, any time you could cast a sorcery (during your main phase when the stack is empty), you can pay 3 generic mana to put your companion from your sideboard into your hand. This is a special action, not an activated ability.

Tabletop Effective Date (Rules and B&R): June 1, 2020
MTG Arena B&R and Companion Rules Effective Date: June 4, 2020
Magic Online B&R Effective Date: June 1, 2020
Magic Online Companion Rules Update Effective Date: June 3, 2020`,
  },
  {
    _id: 'source-br-2020-06-01-standard',
    _type: 'sourceDoc',
    title: `${TITLE} — Standard bans`,
    sourceUrl: SRC,
    publishedAt: '2020-06-01',
    author: 'Ian Duke',
    language: 'en',
    about: ['standard', 'fires-of-invention', 'agent-of-treachery'],
    excerpt: `Standard: Agent of Treachery is banned. Fires of Invention is banned.

Tabletop Effective Date (Rules and B&R): June 1, 2020
MTG Arena B&R and Companion Rules Effective Date: June 4, 2020
Magic Online B&R Effective Date: June 1, 2020

These card bans and suspensions will immediately go into effect for all Standard and Historic play queues once maintenance on June 4 is complete.`,
  },
  {
    _id: 'source-br-2020-06-01-why',
    _type: 'sourceDoc',
    title: `${TITLE} — why the companion change`,
    sourceUrl: SRC,
    publishedAt: '2020-06-01',
    author: 'Ian Duke',
    language: 'en',
    about: ['companion', 'balance'],
    excerpt: `Our reason for making this change is based on metagame data and play rates of companion decks across all formats, and on player feedback on repetitive gameplay patterns. As a group, decks using companions have too high of win rates and metagame share in Standard, Pioneer, and Modern.`,
  },
]

const banCards = [
  {
    key: 'fires',
    subject: 'fires-of-invention',
    name: 'Fires of Invention',
    banned: {
      en: 'Banned in Standard.',
      fr: 'Banni en Standard.',
      de: 'In Standard verboten.',
      es: 'Prohibido en Standard.',
    },
    legal: {
      en: 'Still legal in Standard until the platform ban clock.',
      fr: 'Encore légal en Standard jusqu’à l’horloge d’interdiction de la plateforme.',
      de: 'In Standard noch legal bis zur Ban-Uhr der Plattform.',
      es: 'Aún legal en Standard hasta el reloj de ban de la plataforma.',
    },
  },
  {
    key: 'agent',
    subject: 'agent-of-treachery',
    name: 'Agent of Treachery',
    banned: {
      en: 'Banned in Standard.',
      fr: 'Banni en Standard.',
      de: 'In Standard verboten.',
      es: 'Prohibido en Standard.',
    },
    legal: {
      en: 'Still legal in Standard until the platform ban clock.',
      fr: 'Encore légal en Standard jusqu’à l’horloge d’interdiction de la plateforme.',
      de: 'In Standard noch legal bis zur Ban-Uhr der Plattform.',
      es: 'Aún legal en Standard hasta el reloj de ban de la plataforma.',
    },
  },
]

// B&R clocks from the same announcement: tabletop+mtgo June 1, Arena June 4
const banClaims = []
for (const card of banCards) {
  for (const platform of ['tabletop', 'mtgo', 'arena']) {
    const switchOn = platform === 'arena' ? '2020-06-04' : '2020-06-01'
    banClaims.push({
      _id: `claim-${card.key}-${platform}-legal`,
      _type: 'rulesClaim',
      game: 'Magic: The Gathering',
      subject: card.subject,
      predicate: 'legalInStandard',
      platform,
      status: 'superseded',
      value: card.legal.en,
      valueFr: card.legal.fr,
      valueDe: card.legal.de,
      valueEs: card.legal.es,
      quote: `${card.name} remains playable until the ${platform} B&R clock.`,
      effectiveFrom: '2019-10-04',
      effectiveUntil: switchOn,
      sourceTitle: TITLE,
      sourceUrl: SRC,
    })
    banClaims.push({
      _id: `claim-${card.key}-${platform}-banned`,
      _type: 'rulesClaim',
      game: 'Magic: The Gathering',
      subject: card.subject,
      predicate: 'legalInStandard',
      platform,
      status: 'current',
      value: card.banned.en,
      valueFr: card.banned.fr,
      valueDe: card.banned.de,
      valueEs: card.banned.es,
      quote: `${card.name} is banned. Platform clock: ${switchOn}.`,
      effectiveFrom: switchOn,
      effectiveUntil: null,
      sourceTitle: TITLE,
      sourceUrl: SRC,
    })
  }
}

const companionPatches = [
  'claim-tabletop-old',
  'claim-arena-old',
  'claim-mtgo-old',
].map((id) => ({
  patch: {
    id,
    set: {
      valueFr: companionOld.fr,
      valueDe: companionOld.de,
      valueEs: companionOld.es,
    },
  },
}))

const companionPatchesNew = [
  'claim-tabletop-current',
  'claim-arena-current',
  'claim-mtgo-current',
].map((id) => ({
  patch: {
    id,
    set: {
      valueFr: companionNew.fr,
      valueDe: companionNew.de,
      valueEs: companionNew.es,
    },
  },
}))

const moreCalls = [
  {
    _id: 'call-fires-arena-june2',
    _type: 'workedCall',
    title: 'Fires on Arena, June 2',
    question: 'On Arena, June 2 2020, is Fires of Invention banned in Standard?',
    date: '2020-06-02',
    finding:
      'No. Arena’s B&R clock is June 4. Tabletop banned it June 1. Same announcement, two clocks.',
  },
  {
    _id: 'call-fires-fr',
    _type: 'workedCall',
    title: 'Fires — question FR',
    question: 'Sur Arena, le 2 juin 2020, Fires of Invention est-il banni en Standard ?',
    date: '2020-06-02',
    finding: 'Non. L’horloge Arena est le 4 juin. La table l’a banni le 1er juin.',
  },
  {
    _id: 'call-companion-de',
    _type: 'workedCall',
    title: 'Companion — question DE',
    question: 'Zwei Tage bevor Arena umgestellt hat: zahle ich 3 oder spiele ich von außerhalb?',
    date: '2020-06-02',
    finding: 'Arena am 2. Juni: noch von außerhalb. Keine 3 Mana.',
  },
]

const sourcesContext = {
  _id: 'errata-sources-context',
  _type: 'sanity.agentContext',
  name: 'Errata Sources',
  slug: {_type: 'slug', current: 'errata-sources'},
  groqFilter: '_type == "sourceDoc"',
  instructions: `You only read primary-source excerpts (sourceDoc).

Every answer must cite sourceUrl. Prefer the Ian Duke June 1 2020 Banned and Restricted Announcement.

Clocks from that page: tabletop rules+B&R June 1; Magic Online B&R June 1 and companion June 3; Arena B&R+companion June 4.

Do not invent quotes. If the excerpt is missing the line, say the desk does not have that line on file.`,
}

const deskFilterPatch = {
  patch: {
    id: 'errata-desk-context',
    set: {
      groqFilter:
        '_type in ["rulesClaim", "ruling", "rulesChange", "workedCall", "companionCard", "cardRuling", "sourceDoc", "deskCase"]',
      instructions: `Answer Magic rules and Standard legality questions that depend on platform clocks.

Clocks from the June 1 2020 Ian Duke announcement:
- companion procedure: tabletop 2020-06-01, Magic Online 2020-06-03, Arena 2020-06-04
- Standard bans (Fires of Invention, Agent of Treachery): tabletop and Magic Online 2020-06-01, Arena 2020-06-04

"N days before X switched" uses that clock minus N. Read clocks with array_field_reader on rules-change-companion.clocks.

Check standing rulings before deriving. Word overlap is not current.

If the ask is in French, German, or Spanish, prefer valueFr / valueDe / valueEs on the claim when present.

For primary quotes, read sourceDoc documents or the errata-sources MCP.`,
    },
  },
}

const mutations = [
  ...sources.map((doc) => ({createOrReplace: doc})),
  ...banClaims.map((doc) => ({createOrReplace: doc})),
  ...moreCalls.map((doc) => ({createOrReplace: doc})),
  {createOrReplace: sourcesContext},
  deskFilterPatch,
  ...companionPatches,
  ...companionPatchesNew,
  {
    createOrReplace: {
      _id: 'rules-change-standard-bans',
      _type: 'rulesChange',
      title: 'Standard bans, June 1 2020',
      subject: 'standard-bans',
      sourceUrl: SRC,
      clocks: [
        {_key: 'tabletop', platform: 'tabletop', switchesOn: '2020-06-01'},
        {_key: 'mtgo', platform: 'mtgo', switchesOn: '2020-06-01'},
        {_key: 'arena', platform: 'arena', switchesOn: '2020-06-04'},
      ],
    },
  },
]

const res = await fetch(`https://${projectId}.api.sanity.io/v2021-06-07/data/mutate/${dataset}`, {
  method: 'POST',
  headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
  body: JSON.stringify({mutations}),
})
const body = await res.text()
if (!res.ok) {
  console.error(body.slice(0, 800))
  process.exit(1)
}
console.log(
  'seeded sources',
  sources.length,
  'banClaims',
  banClaims.length,
  'calls',
  moreCalls.length,
  '+ errata-sources MCP',
)
