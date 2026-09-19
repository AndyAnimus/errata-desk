import {createServer} from 'node:http'
import {readFileSync} from 'node:fs'

const OLLAMA = 'http://127.0.0.1:11434/api/chat'
const MODEL = 'qwen2.5:7b-instruct-q4_K_M'
const PROJECT = 'gsu7qzk9'
const DATASET = 'production'
const MCP = `https://api.sanity.io/v2026-03-03/context/mcp/${PROJECT}/${DATASET}/errata-desk`

function loadToken() {
  const raw = readFileSync(new URL('./secrets/sanity.env', import.meta.url), 'utf8')
  for (const line of raw.split('\n')) {
    if (line.startsWith('SANITY_API_TOKEN=')) return line.slice('SANITY_API_TOKEN='.length)
  }
  throw new Error('missing token')
}
const TOKEN = loadToken()

const CLOCKS = {
  tabletop: '2020-06-01',
  mtgo: '2020-06-03',
  arena: '2020-06-04',
}

async function mcp(name, args = {}) {
  const res = await fetch(MCP, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {name, arguments: args},
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message || 'mcp error')
  const text = data.result?.content?.[0]?.text
  if (!text) return {raw: data}
  try {
    return JSON.parse(text)
  } catch {
    return {text}
  }
}

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function platformOf(low) {
  if (/\barena\b|\bmtga\b/.test(low)) return 'arena'
  if (/\bmtgo\b|\bmodo\b|magic online/.test(low)) return 'mtgo'
  if (/\bpaper\b|\btabletop\b|at the table|in person|kitchen/.test(low)) return 'tabletop'
  return null
}

function resolveKnown(text) {
  const low = text.toLowerCase()
  const words = {one: 1, two: 2, three: 3, four: 4}
  const rel = low.match(
    /(\d+|one|two|three|four)\s+days?\s+before\s+(arena|mtga|tabletop|paper|mtgo|magic online)/,
  )
  if (rel) {
    const n = words[rel[1]] || Number(rel[1])
    const platform = platformOf(rel[2]) || platformOf(low)
    if (platform && Number.isFinite(n)) {
      return {
        inScope: true,
        platform,
        date: addDays(CLOCKS[platform], -n),
        reading: `${n} day${n === 1 ? '' : 's'} before ${platform} switched (${CLOCKS[platform]})`,
      }
    }
  }
  if (/day before arena/.test(low)) {
    return {
      inScope: true,
      platform: 'arena',
      date: addDays(CLOCKS.arena, -1),
      reading: 'the day before Arena switched',
    }
  }
  const dated =
    low.match(/\b(?:june|jun)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*|\s+)(2020)\b/) ||
    low.match(/\b(2020)-0?6-0?(\d{1,2})\b/)
  if (dated) {
    let d
    if (dated[0].startsWith('2020')) {
      d = `2020-06-${String(Number(dated[2])).padStart(2, '0')}`
    } else {
      d = `2020-06-${String(Number(dated[1])).padStart(2, '0')}`
    }
    const platform = platformOf(low) || (/on paper|paper|table/.test(low) ? 'tabletop' : null)
    if (platform) {
      return {
        inScope: true,
        platform,
        date: d,
        reading: `${platform} on ${d}`,
      }
    }
  }
  return null
}

async function readQuestion(text) {
  const prompt = `Convert the player's question into JSON. The desk only knows how a Magic companion enters the game.

Clocks, all in 2020:
- tabletop (paper, in person, at the table) switches on 2020-06-01
- Magic Online (mtgo, modo) switches on 2020-06-03
- MTG Arena (arena, mtga) switches on 2020-06-04
Announcement day is 2020-06-01.
"the day before Arena switched" is 2020-06-03.

Return only JSON:
{"inScope":true,"platform":"tabletop","date":"2020-06-02","reading":"one sentence"}
platform is tabletop, arena, mtgo, or null. date is YYYY-MM-DD or null.
inScope is false if this is not about that procedure.

Question: ${text}`
  const res = await fetch(OLLAMA, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: 'json',
      messages: [{role: 'user', content: prompt}],
    }),
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error('model unavailable')
  const data = await res.json()
  return JSON.parse(data.message?.content || '{}')
}

function split(rows, date) {
  const inForce = rows.filter((c) => {
    if (c.effectiveFrom && date < c.effectiveFrom) return false
    if (c.effectiveUntil && date >= c.effectiveUntil) return false
    return true
  })
  return {inForce, notInForce: rows.filter((c) => !inForce.includes(c))}
}

async function saveRuling({platform, date, claimId, reading}) {
  const claims = await mcp('groq_query', {
    query: `*[_type=="rulesClaim" && _id=="${claimId}"][0]{_id,value,sourceUrl}`,
  })
  const claim = (claims.result || claims)?.[0] || claims.result || claims
  const row = Array.isArray(claim) ? claim[0] : claim?.result?.[0] || claim
  const value = row?.value
  if (!value) throw new Error('unknown claim')
  const id = `ruling-${platform}-${date}`
  const doc = {
    _id: id,
    _type: 'ruling',
    platform,
    date,
    claimId,
    reading: reading || '',
    value,
    sourceUrl: row.sourceUrl,
  }
  const res = await fetch(`https://${PROJECT}.api.sanity.io/v2021-06-07/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({mutations: [{createOrReplace: doc}]}),
  })
  if (!res.ok) throw new Error('could not store ruling')
  return doc
}

function unpack(payload) {
  if (!payload) return null
  if (Array.isArray(payload.result)) return payload.result
  if (Array.isArray(payload)) return payload
  if (payload.result && !Array.isArray(payload.result)) return payload.result
  return payload
}

async function answer(text) {
  const tools = []
  const known = resolveKnown(text)
  const parsed = known || (await readQuestion(text))
  const platform =
    known?.platform || (['tabletop', 'arena', 'mtgo'].includes(parsed.platform) ? parsed.platform : null)
  const date = known?.date || (/^\d{4}-\d{2}-\d{2}$/.test(parsed.date || '') ? parsed.date : null)

  const ctx = await mcp('initial_context', {})
  tools.push({
    name: 'initial_context',
    detail: typeof ctx.text === 'string' ? ctx.text.slice(0, 180) : 'schema + instructions loaded',
  })

  const clocks = await mcp('array_field_reader', {
    mode: 'range',
    documentId: 'rules-change-companion',
    field: 'clocks',
    range: {startIndex: 0, endIndex: 3},
  })
  tools.push({name: 'array_field_reader', detail: 'rules-change-companion.clocks[0…3]'})

  if (!parsed.inScope) {
    return {
      reading: parsed.reading || 'Outside this desk.',
      answer: 'This desk only knows the companion procedure. Ask about paper, Arena, or Magic Online around June 2020.',
      inForce: [],
      notInForce: [],
      tools,
      clocks: unpack(clocks),
    }
  }
  if (!platform || !date) {
    return {
      reading: parsed.reading || 'Need a platform and a day.',
      answer: `Which table, and which day? Tabletop switches ${CLOCKS.tabletop}, Magic Online ${CLOCKS.mtgo}, Arena ${CLOCKS.arena}.`,
      inForce: [],
      notInForce: [],
      tools,
      clocks: unpack(clocks),
    }
  }

  const standingQ = `*[_type=="ruling" && platform=="${platform}" && date=="${date}"][0]{claimId,value,sourceUrl,reading}`
  const boundRaw = await mcp('groq_query', {query: standingQ})
  tools.push({name: 'groq_query', detail: standingQ})
  const bound = unpack(boundRaw)
  const boundDoc = Array.isArray(bound) ? null : bound

  const claimsQ = `*[_type=="rulesClaim" && platform=="${platform}" && predicate=="bringIntoGame"]{_id,status,value,quote,effectiveFrom,effectiveUntil,sourceTitle,sourceUrl}`
  const claimsRaw = await mcp('groq_query', {query: claimsQ})
  tools.push({name: 'groq_query', detail: claimsQ})
  const rows = unpack(claimsRaw) || []
  const list = Array.isArray(rows) ? rows : []
  const {inForce, notInForce} = split(list, date)

  if (boundDoc && boundDoc.value) {
    return {
      reading: parsed.reading || `${platform} on ${date}`,
      platform,
      date,
      bound: true,
      answer: `Standing ruling in the lake, not a fresh guess. On ${date}, ${platform}: ${boundDoc.value}`,
      inForce,
      notInForce,
      ruling: boundDoc,
      tools,
      clocks: unpack(clocks),
    }
  }

  const line = inForce[0]
  return {
    reading: parsed.reading || `${platform} on ${date}`,
    platform,
    date,
    bound: false,
    answer: line
      ? `Derived, not yet ruled. On ${date}, ${platform}: ${line.value}`
      : `No claim covers ${platform} on ${date}.`,
    inForce,
    notInForce,
    tools,
    clocks: unpack(clocks),
  }
}

const page = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Errata Desk — three clocks</title>
<style>
  :root {
    --ink: #e8e2d4;
    --mute: #9a917e;
    --paper: #14110e;
    --rail: #1f1a14;
    --line: #3a3226;
    --force: #c8f07a;
    --force-dim: rgba(200,240,122,.12);
    --stale: #ff8f6b;
    --stale-dim: rgba(255,143,107,.1);
    --bound: #7ad4ff;
    --accent: #f0c75e;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    color: var(--ink);
    background:
      radial-gradient(1200px 600px at 10% -10%, #2a2116 0%, transparent 55%),
      radial-gradient(900px 500px at 100% 0%, #1a2430 0%, transparent 50%),
      var(--paper);
    font: 15px/1.5 "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  }
  .wrap { max-width: 58rem; margin: 0 auto; padding: 2rem 1.1rem 4rem; }
  .kicker {
    letter-spacing: .18em; text-transform: uppercase; color: var(--accent);
    font-size: .72rem; margin: 0 0 .4rem;
  }
  h1 {
    font: 700 2.4rem/1.05 "IBM Plex Serif", Georgia, serif;
    margin: 0 0 .6rem; letter-spacing: -.02em;
  }
  .lede { color: var(--mute); max-width: 40rem; margin: 0 0 1.4rem; }
  .clocks {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: .7rem; margin: 0 0 1.4rem;
  }
  .clock {
    background: var(--rail); border: 1px solid var(--line); border-radius: 14px;
    padding: .85rem .9rem; position: relative; overflow: hidden;
  }
  .clock::before {
    content: ""; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--accent);
  }
  .clock.active { outline: 1px solid color-mix(in srgb, var(--force) 55%, transparent); }
  .clock .who { font-size: .72rem; letter-spacing: .12em; text-transform: uppercase; color: var(--mute); }
  .clock .when { font: 700 1.35rem/1 "IBM Plex Serif", Georgia, serif; margin-top: .25rem; }
  .clock .tag { margin-top: .45rem; font-size: .78rem; color: var(--mute); }
  label { display: block; font-size: .78rem; color: var(--mute); margin-bottom: .35rem; letter-spacing: .04em; }
  textarea {
    width: 100%; min-height: 5.2rem; resize: vertical;
    background: #0e0c0a; color: var(--ink); border: 1px solid var(--line);
    border-radius: 12px; padding: .85rem .95rem; font: inherit;
  }
  .actions { display: flex; gap: .6rem; flex-wrap: wrap; margin: .7rem 0 0; align-items: center; }
  button {
    font: 600 .92rem/1 inherit; border: 0; cursor: pointer; border-radius: 999px;
    padding: .65rem 1.05rem; background: var(--ink); color: #15110c;
  }
  button.ghost { background: transparent; color: var(--ink); border: 1px solid var(--line); }
  button:disabled { opacity: .55; cursor: wait; }
  .chip {
    display: inline-flex; align-items: center; gap: .35rem;
    border: 1px solid var(--line); border-radius: 999px; padding: .25rem .65rem;
    font-size: .75rem; color: var(--mute);
  }
  .chip b { color: var(--ink); font-weight: 600; }
  .panel {
    margin-top: 1.1rem; border: 1px solid var(--line); border-radius: 16px;
    background: color-mix(in srgb, var(--rail) 88%, black); padding: 1rem 1.05rem;
  }
  .panel.force { background: linear-gradient(180deg, var(--force-dim), transparent 70%); border-color: color-mix(in srgb, var(--force) 35%, var(--line)); }
  .panel.stale { background: linear-gradient(180deg, var(--stale-dim), transparent 70%); border-color: color-mix(in srgb, var(--stale) 30%, var(--line)); }
  .panel.bound { border-color: color-mix(in srgb, var(--bound) 45%, var(--line)); box-shadow: 0 0 0 1px color-mix(in srgb, var(--bound) 20%, transparent) inset; }
  .eyebrow { font-size: .72rem; letter-spacing: .14em; text-transform: uppercase; color: var(--mute); margin: 0 0 .35rem; }
  .answer { font: 600 1.15rem/1.35 "IBM Plex Serif", Georgia, serif; margin: 0; }
  .muted { color: var(--mute); margin: .45rem 0 0; }
  .claim { margin-top: .7rem; padding-top: .7rem; border-top: 1px dashed var(--line); }
  .claim p { margin: .2rem 0; }
  .quote { color: var(--mute); font-size: .9rem; font-style: italic; }
  .bind {
    margin-top: .55rem; background: transparent; color: var(--accent);
    border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--line));
  }
  .tools { margin-top: 1rem; }
  .tools summary { cursor: pointer; color: var(--mute); font-size: .85rem; }
  .tool {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: .75rem; color: var(--mute); border-left: 2px solid var(--line);
    padding: .25rem 0 .25rem .65rem; margin: .35rem 0;
  }
  .tool b { color: var(--bound); }
  .needle {
    margin: 1rem 0 0; height: 42px; position: relative;
    background: linear-gradient(90deg, #2a2218, #1a2a22 45%, #2a1a18);
    border: 1px solid var(--line); border-radius: 999px; overflow: hidden;
  }
  .needle i {
    position: absolute; top: 0; bottom: 0; width: 2px; background: var(--force);
    box-shadow: 0 0 12px var(--force);
  }
  .needle span {
    position: absolute; top: 50%; transform: translate(-50%, -50%);
    font-size: .68rem; letter-spacing: .08em; text-transform: uppercase; color: var(--mute);
  }
  footer { margin-top: 1.6rem; color: var(--mute); font-size: .8rem; }
  footer a { color: var(--accent); }
  @media (max-width: 720px) {
    .clocks { grid-template-columns: 1fr; }
    h1 { font-size: 1.85rem; }
  }
</style>
<body>
  <main class="wrap">
    <p class="kicker">Sanity Context · Path One</p>
    <h1>Errata Desk</h1>
    <p class="lede">Same companion sentence. Three clocks. The model only reads the question. The lake decides what is in force. Bind a call and that day stops being a guess.</p>

    <div class="clocks" id="clocks">
      <div class="clock" data-p="tabletop"><div class="who">Tabletop</div><div class="when">Jun 1</div><div class="tag">switches 2020-06-01</div></div>
      <div class="clock" data-p="mtgo"><div class="who">Magic Online</div><div class="when">Jun 3</div><div class="tag">switches 2020-06-03</div></div>
      <div class="clock" data-p="arena"><div class="who">MTG Arena</div><div class="when">Jun 4</div><div class="tag">switches 2020-06-04</div></div>
    </div>

    <div class="needle" id="needle" hidden>
      <span style="left:0%">Jun 1</span>
      <span style="left:50%">Jun 2–3</span>
      <span style="left:100%">Jun 4</span>
      <i id="needleMark"></i>
    </div>

    <label for="q">Ask any day around the switch</label>
    <textarea id="q">two days before Arena switched, do I pay 3 or cast it from outside the game?</textarea>
    <div class="actions">
      <button id="go">Ask the lake</button>
      <button class="ghost" id="sample" type="button">Paper on June 2</button>
      <span class="chip" id="status"><b>idle</b> · Context MCP ready</span>
    </div>
    <div id="out"></div>
    <footer>
      Studio <a href="https://luis-errata-desk.sanity.studio/" target="_blank" rel="noreferrer">luis-errata-desk.sanity.studio</a>
      · Context <code>gsu7qzk9 / production / errata-desk</code>
    </footer>
  </main>
<script>
let last = null
const SWITCH = {tabletop:'2020-06-01', mtgo:'2020-06-03', arena:'2020-06-04'}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

function setNeedle(date, platform) {
  const el = document.getElementById('needle')
  const mark = document.getElementById('needleMark')
  if (!date) { el.hidden = true; return }
  el.hidden = false
  const day = Number(date.slice(-2))
  const pct = Math.max(0, Math.min(100, ((day - 1) / 3) * 100))
  mark.style.left = pct + '%'
  document.querySelectorAll('.clock').forEach(c => {
    c.classList.toggle('active', c.dataset.p === platform)
  })
}

function claimCard(title, items, bind, kind) {
  if (!items || !items.length) return ''
  return '<section class="panel ' + kind + '"><p class="eyebrow">' + esc(title) + '</p>' +
    items.map(c => '<div class="claim"><p><strong>' + esc(c.value) + '</strong></p>' +
      (c.quote ? '<p class="quote">“' + esc(c.quote) + '”</p>' : '') +
      '<p class="muted">' + esc(c.effectiveFrom || '?') +
      (c.effectiveUntil ? ' → ' + esc(c.effectiveUntil) : ' → open') +
      (c.sourceTitle ? ' · ' + esc(c.sourceTitle) : '') + '</p>' +
      (bind ? '<button class="bind" data-id="' + esc(c._id) +'">Bind this call into the lake</button>' : '') +
    '</div>').join('') + '</section>'
}

function toolsBox(tools) {
  if (!tools || !tools.length) return ''
  return '<details class="tools" open><summary>Context tools this ask actually called</summary>' +
    tools.map(t => '<div class="tool"><b>' + esc(t.name) + '</b><br>' + esc(t.detail) + '</div>').join('') +
    '</details>'
}

async function ask() {
  const out = document.getElementById('out')
  const status = document.getElementById('status')
  status.innerHTML = '<b>reading</b> · initial_context → clocks → groq'
  const btn = document.getElementById('go')
  btn.disabled = true
  out.innerHTML = '<section class="panel"><p class="muted">Consulting the lake…</p></section>'
  try {
    const res = await fetch('ask', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({q: document.getElementById('q').value})
    })
    last = await res.json()
    setNeedle(last.date, last.platform)
    const boundClass = last.bound ? ' bound' : ''
    out.innerHTML =
      '<section class="panel' + boundClass + '">' +
        '<p class="eyebrow">' + (last.bound ? 'Standing ruling' : 'Derived call') + '</p>' +
        '<p class="answer">' + esc(last.answer) + '</p>' +
        '<p class="muted">' + esc(last.reading || '') +
          (last.platform ? ' · ' + esc(last.platform) + ' @ ' + esc(last.date) : '') +
          (last.bound ? ' · already bound' : '') + '</p>' +
      '</section>' +
      claimCard('In force on this clock', last.inForce, !last.bound, 'force') +
      claimCard('Also in the lake, not in force', last.notInForce, !last.bound, 'stale') +
      toolsBox(last.tools)
    status.innerHTML = last.bound
      ? '<b>bound</b> · returned stored ruling'
      : '<b>derived</b> · bind to make it stick'
    out.querySelectorAll('button[data-id]').forEach(b => b.onclick = async () => {
      b.disabled = true
      b.textContent = 'Binding…'
      status.innerHTML = '<b>writing</b> · ruling document'
      await fetch('rule', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          platform: last.platform,
          date: last.date,
          claimId: b.dataset.id,
          reading: last.reading
        })
      })
      await ask()
    })
  } catch (e) {
    out.innerHTML = '<section class="panel stale"><p class="answer">Ask failed.</p><p class="muted">' + esc(e.message || e) + '</p></section>'
    status.innerHTML = '<b>error</b>'
  } finally {
    btn.disabled = false
  }
}

document.getElementById('go').onclick = ask
document.getElementById('sample').onclick = () => {
  document.getElementById('q').value = 'On paper, June 2 2020 — pay 3 or cast from outside the game?'
  ask()
}
</script>
</body>
</html>`

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}'))
      } catch (e) {
        reject(e)
      }
    })
  })
}

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  const url = req.url || '/'
  if (req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
    res.end(page)
    return
  }
  try {
    if (req.method === 'POST' && url.startsWith('/ask')) {
      const body = await readBody(req)
      const result = await answer(String(body.q || ''))
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify(result))
      return
    }
    if (req.method === 'POST' && url.startsWith('/rule')) {
      const body = await readBody(req)
      const doc = await saveRuling(body)
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify({ok: true, id: doc._id}))
      return
    }
  } catch (e) {
    res.writeHead(500, {'Content-Type': 'application/json'})
    res.end(JSON.stringify({answer: 'Failed.', error: String(e.message || e)}))
    return
  }
  res.writeHead(404)
  res.end()
}).listen(8791, '127.0.0.1')
