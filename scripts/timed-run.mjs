import {readFileSync} from 'node:fs'

const token = readFileSync(new URL('../secrets/sanity.env', import.meta.url), 'utf8')
  .split('\n')
  .find((l) => l.startsWith('SANITY_API_TOKEN='))
  .slice('SANITY_API_TOKEN='.length)

const PROJECT = 'gsu7qzk9'
const DATASET = 'production'
const ID = 'case-timed-run'
const BASE = 'http://127.0.0.1:8791'

async function mutate(mutations) {
  const res = await fetch(`https://${PROJECT}.api.sanity.io/v2021-06-07/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({mutations}),
  })
  if (!res.ok) throw new Error(await res.text())
}

async function step(name, fn) {
  const t0 = Date.now()
  try {
    const note = await fn()
    const row = {name, ms: Date.now() - t0, ok: true, note: note || 'ok', _key: name}
    console.log('ok', row.ms + 'ms', name)
    return row
  } catch (e) {
    const row = {name, ms: Date.now() - t0, ok: false, note: String(e.message || e).slice(0, 180), _key: name}
    console.log('fail', row.ms + 'ms', name, row.note)
    return row
  }
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || res.status)
  return data
}

async function signQuery() {
  const q = `*[_id=="${ID}"][0]{state,decidedBy,decidedAt}`
  const res = await fetch('https://api.sanity.io/v2026-03-03/context/mcp/gsu7qzk9/production/errata-sign', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {name: 'groq_query', arguments: {query: q}},
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'sign mcp')
  return JSON.parse(data.result.content[0].text)
}

const steps = []
steps.push(await step('create-asked', async () => {
  await mutate([{
    createOrReplace: {
      _id: ID,
      _type: 'deskCase',
      title: 'Timed run',
      platform: 'mtgo',
      date: '2020-06-03',
      value: 'Pay 3 generic mana to put the companion into your hand, then cast it.',
      state: 'asked',
      transitions: [],
    },
  }])
  return 'asked'
}))
steps.push(await step('agent-to-derived', () => post('/advance', {id: ID, to: 'derived', actor: 'agent'}).then((d) => d.state)))
steps.push(await step('agent-to-awaiting', () => post('/advance', {id: ID, to: 'awaitingSignature', actor: 'agent'}).then((d) => d.state)))
steps.push(await step('agent-cannot-sign', async () => {
  try {
    await post('/advance', {id: ID, to: 'signed', actor: 'agent'})
    throw new Error('agent was allowed to sign')
  } catch (e) {
    if (String(e.message).includes('allowed to sign')) throw e
    return 'refused'
  }
}))
steps.push(await step('sign-mcp-still-empty', async () => {
  const raw = await signQuery()
  const row = raw.result?.[0] || raw.result || raw
  const doc = Array.isArray(row) ? row[0] : row
  if (doc?.decidedBy || doc?.decidedAt) throw new Error('fields were filled early')
  return 'decidedBy empty'
}))
steps.push(await step('person-signs', () => post('/sign', {id: ID, name: 'timed-run'}).then((d) => d.decidedBy)))
steps.push(await step('sign-mcp-sees-signer', async () => {
  const raw = await signQuery()
  const text = JSON.stringify(raw)
  if (!text.includes('timed-run')) throw new Error('signer not visible on errata-sign')
  return 'timed-run'
}))
steps.push(await step('blank-name-refused', async () => {
  await mutate([{patch: {id: ID, set: {state: 'awaitingSignature', decidedBy: null, decidedAt: null}}}])
  try {
    await post('/sign', {id: ID, name: '   '})
    throw new Error('blank name was accepted')
  } catch (e) {
    if (String(e.message).includes('blank name')) throw e
    return 'refused'
  }
}))

const passed = steps.filter((s) => s.ok).length
const failed = steps.length - passed
await mutate([{
  createOrReplace: {
    _id: 'timed-run-latest',
    _type: 'timedRun',
    title: `Timed edit run ${passed}/${steps.length}`,
    ranAt: new Date().toISOString(),
    passed,
    failed,
    steps: steps.map(({_key, ...rest}) => ({_key, ...rest})),
  },
}])
console.log(`timed run ${passed}/${steps.length}`)
if (failed) process.exit(1)
