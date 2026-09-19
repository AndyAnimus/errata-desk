import {createSanityInstance, getClient} from '@sanity/sdk'
import './app.css'

type Case = {
  _id: string
  title?: string
  platform?: string
  date?: string
  state?: string
  decidedBy?: string | null
  decidedAt?: string | null
  value?: string
}

const query = '*[_type=="deskCase"]|order(date asc){_id,title,platform,date,state,decidedBy,decidedAt,value}'

function esc(s: string | null | undefined) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c] || c))
}

function paint(rows: Case[]) {
  const root = document.getElementById('root')
  if (!root) return
  const cards = rows.map((row) => {
    const signed = Boolean(row.decidedBy && row.decidedAt)
    return '<article class="' + (signed ? 'signed' : 'open') + '">' +
      '<p class="who">' + esc(row.platform) + ' · ' + esc(row.date) + '</p>' +
      '<h2>' + (signed ? 'Signed' : 'Unsigned') + '</h2>' +
      '<p>' + esc(row.value) + '</p>' +
      '<p class="meta">decidedBy: ' + esc(row.decidedBy || '—') + ' · decidedAt: ' + esc(row.decidedAt || '—') + '</p>' +
      '</article>'
  }).join('')
  root.innerHTML =
    '<main><p class="kicker">App SDK · live from the lake</p>' +
    '<h1>Unsigned until a person signs</h1>' +
    '<p class="lede">This board is the Sanity App SDK reading deskCase. decidedBy and decidedAt stay blank until a person signs.</p>' +
    (cards || '<p>No cases in the lake yet.</p>') +
    '</main>'
}

const root = document.getElementById('root')
const apiHost = location.pathname.startsWith('/errata-desk/')
  ? location.origin + '/errata-desk/sanity-api'
  : location.origin + '/sanity-api'
try {
  const instance = createSanityInstance({projectId: 'gsu7qzk9', dataset: 'production'})
  const client = getClient(instance, {
    apiVersion: '2024-11-12',
    apiHost,
    useProjectHostname: false,
    useCdn: false,
  })
  client.fetch<Case[]>(query).then((rows) => {
    paint(rows)
    try {
      client.listen(query, {}, {includeResult: true}).subscribe((event) => {
        const next = (event as {result?: Case[]}).result
        if (next) paint(next)
      })
    } catch {
      /* the first fetch is the board; listen is the live half */
    }
  }).catch((e) => {
    if (root) root.textContent = 'The lake did not answer. ' + (e?.message || e)
  })
} catch (e) {
  if (root) root.textContent = 'App SDK did not start. ' + ((e as Error).message || e)
}
