import {readFileSync} from 'node:fs'

const projectId = 'gsu7qzk9'
const dataset = 'production'
const token = readFileSync(new URL('../secrets/sanity.env', import.meta.url), 'utf8')
  .split('\n')
  .find((l) => l.startsWith('SANITY_API_TOKEN='))
  .slice('SANITY_API_TOKEN='.length)

const signInstructions = `You are the signature desk, not the rules desk.

You can see only deskCase documents. You cannot see the clocks. Those live on the other endpoint, slug errata-desk.

A case is unsigned while decidedBy or decidedAt is missing. Say "unsigned" and leave both fields empty. Do not invent a signer, a time, or a signature.

state awaitingSignature means a person has not signed. Only a person moves that case to signed, and only then are decidedBy and decidedAt filled.

If the query returns nothing, say there is no decision on file.`

const docs = [
  {
    _id: 'errata-sign-context',
    _type: 'sanity.agentContext',
    name: 'Errata Sign',
    slug: {_type: 'slug', current: 'errata-sign'},
    groqFilter: '_type == "deskCase"',
    instructions: signInstructions,
  },
  {
    _id: 'workflow-sign-call',
    _type: 'deskWorkflow',
    title: 'Sign a derived call',
    steps: [
      {_key: 'a', from: 'asked', to: 'derived', actor: 'agent'},
      {_key: 'b', from: 'derived', to: 'awaitingSignature', actor: 'agent'},
      {_key: 'c', from: 'awaitingSignature', to: 'signed', actor: 'person'},
    ],
  },
  {
    _id: 'case-arena-2020-06-02',
    _type: 'deskCase',
    title: 'Arena, two days before the switch',
    platform: 'arena',
    date: '2020-06-02',
    claimId: 'claim-arena-old',
    value: 'Cast the companion once from outside the game. No extra generic cost.',
    reading: 'two days before Arena switched',
    state: 'awaitingSignature',
    transitions: [
      {_key: 't1', at: '2026-09-19T15:00:00Z', from: 'asked', to: 'derived', actor: 'agent'},
      {_key: 't2', at: '2026-09-19T15:00:01Z', from: 'derived', to: 'awaitingSignature', actor: 'agent'},
    ],
  },
]

const res = await fetch(`https://${projectId}.api.sanity.io/v2021-06-07/data/mutate/${dataset}`, {
  method: 'POST',
  headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
  body: JSON.stringify({mutations: docs.map((doc) => ({createOrReplace: doc}))}),
})
const body = await res.text()
if (!res.ok) {
  console.error(body.slice(0, 600))
  process.exit(1)
}
console.log('seeded sign context, workflow, unsigned arena case')
