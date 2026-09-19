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

const src =
  'https://magic.wizards.com/en/news/announcements/june-1-2020-banned-and-restricted-announcement'

const calls = [
  {
    _id: 'call-june3-all',
    title: 'June 3, all three tables',
    question: 'On June 3 2020, what does each table do?',
    date: '2020-06-03',
    finding:
      'One calendar day, three procedures. Tabletop has already been on pay 3 since June 1. Magic Online switches to pay 3 today. Arena still casts the companion from outside the game until June 4.',
  },
  {
    _id: 'call-arena-minus-two',
    title: 'Two days before Arena',
    question: 'Two days before Arena switched, do I pay 3 or cast from outside the game?',
    date: '2020-06-02',
    finding:
      'Arena switches June 4, so two days before is June 2. The pay-3 claim is not in force yet. You still cast the companion once from outside the game.',
  },
  {
    _id: 'call-paper-june2',
    title: 'Paper on June 2',
    question: 'On paper, June 2 2020, pay 3 or cast from outside the game?',
    date: '2020-06-02',
    finding:
      'The table switched June 1. On June 2 the printed Ikoria reminder is already past its window. You pay 3.',
  },
  {
    _id: 'call-same-day-split',
    title: 'Same words, June 2',
    question: 'Why do paper and Arena disagree on June 2?',
    date: '2020-06-02',
    finding:
      'They do not disagree. They are on different clocks. Keyword search returns both sentences and calls it a contradiction. The window filter does not.',
  },
  {
    _id: 'call-arena-switch',
    title: 'Arena switch morning',
    question: 'What changes on Arena on June 4 2020?',
    date: '2020-06-04',
    finding: 'This is the morning Arena joins the new procedure. Pay 3, put the companion into your hand, then cast it.',
  },
  {
    _id: 'call-tabletop-switch',
    title: 'Tabletop switch morning',
    question: 'What changes at the table on June 1 2020?',
    date: '2020-06-01',
    finding: 'Announcement day is the tabletop effective date. Paper pays 3 starting today. Arena and Magic Online do not.',
  },
  {
    _id: 'call-mtgo-switch',
    title: 'Magic Online switch',
    question: 'What does Magic Online do on June 3 2020?',
    date: '2020-06-03',
    finding: 'Magic Online’s companion rules update lands today. Before today it was still the old cast-from-outside reminder.',
  },
  {
    _id: 'call-day-before-arena',
    title: 'The day before Arena',
    question: 'The day before Arena switched, which procedure is in force?',
    date: '2020-06-03',
    finding: 'The day before June 4 is June 3. Arena is still on the old reminder. Do not borrow the tabletop date.',
  },
  {
    _id: 'call-bind',
    title: 'Bind the call',
    question: 'What happens after a judge binds Arena on June 2?',
    date: '2020-06-02',
    finding:
      'The desk writes a ruling document for that platform and day. The next ask returns the stored call instead of deriving it again.',
  },
].map((c) => ({_type: 'workedCall', sourceUrl: src, ...c}))

const res = await fetch(
  `https://${env.SANITY_PROJECT_ID}.api.sanity.io/v2021-06-07/data/mutate/${env.SANITY_DATASET}`,
  {
    method: 'POST',
    headers: {Authorization: `Bearer ${env.SANITY_API_TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      mutations: [
        ...calls.map((doc) => ({createOrReplace: doc})),
        {
          patch: {
            id: 'errata-desk-context',
            set: {
              groqFilter:
                '_type in ["rulesClaim", "ruling", "rulesChange", "workedCall", "companionCard", "cardRuling"]',
            },
          },
        },
      ],
    }),
  },
)
if (!res.ok) {
  console.error((await res.text()).slice(0, 400))
  process.exit(1)
}
console.log('seeded', calls.length, 'desk calls')
