import {readFileSync} from 'node:fs'
const token = readFileSync(new URL('../secrets/sanity.env', import.meta.url), 'utf8')
  .split('\n')
  .find((l) => l.startsWith('SANITY_API_TOKEN='))
  .slice('SANITY_API_TOKEN='.length)
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
    params: {
      name: 'groq_query',
      arguments: {query: '*[_type=="deskCase" && _id=="case-arena-2020-06-02"][0]{title,state,decidedBy,decidedAt}'},
    },
  }),
})
const data = await res.json()
const text = data.result?.content?.[0]?.text || JSON.stringify(data.error || data).slice(0, 400)
console.log(res.status)
console.log(text.slice(0, 500))
