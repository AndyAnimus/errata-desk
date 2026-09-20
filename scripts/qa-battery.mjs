#!/usr/bin/env node
/**
 * Judge-facing QA battery. Hits the live desk (or localhost) and prints pass counts.
 * Usage: node scripts/qa-battery.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://127.0.0.1:8791'

const cases = [
  {
    name: 'arena-minus-two',
    q: 'two days before Arena switched, do I pay 3 or cast it from outside the game?',
    expect: (d) =>
      /outside the game|cast the companion once/i.test(d.answer || '') &&
      d.platform === 'arena' &&
      d.date === '2020-06-02' &&
      (d.decisions || []).some((x) => x.platform === 'arena' && x.signed === false),
  },
  {
    name: 'paper-june-2',
    q: 'On paper, June 2 2020 — pay 3 or cast from outside the game?',
    expect: (d) => /pay 3/i.test(d.answer || '') && d.platform === 'tabletop' && d.date === '2020-06-02',
  },
  {
    name: 'june-3-compare',
    q: 'On Jun 3 2020, what does each table do?',
    expect: (d) => {
      const lanes = d.compare || []
      const by = Object.fromEntries(lanes.map((l) => [l.platform, l.value]))
      return (
        /pay 3/i.test(by.tabletop || '') &&
        /pay 3/i.test(by.mtgo || '') &&
        /outside/i.test(by.arena || '')
      )
    },
  },
  {
    name: 'june-4-compare',
    q: 'On Jun 4 2020, what does each table do?',
    expect: (d) => {
      const lanes = d.compare || []
      return lanes.length === 3 && lanes.every((l) => /pay 3/i.test(l.value || ''))
    },
  },
  {
    name: 'spanish-arena',
    q: 'dos días antes de que Arena cambiara, ¿pago 3 o lanzo desde fuera del juego?',
    expect: (d) => d.platform === 'arena' && d.date === '2020-06-02' && /outside|fuera|cast/i.test(d.answer || ''),
  },
  {
    name: 'semantic-tool',
    q: 'On June 2 2020, do the three tables disagree?',
    expect: (d) =>
      (d.tools || []).some((t) => /semanticSimilarity|groq_query|errata-sign/i.test(t.name + ' ' + (t.detail || ''))),
  },
  {
    name: 'unsigned-fields',
    q: 'two days before Arena switched',
    expect: (d) => {
      const hit = (d.decisions || []).find((x) => x.platform === 'arena')
      return hit && hit.signed === false && !hit.decidedBy && !hit.decidedAt
    },
  },
  {
    name: 'agent-cannot-sign',
    post: '/advance',
    body: {id: 'case-arena-2020-06-02', to: 'signed', actor: 'agent'},
    expectStatus: (status, data) => status >= 400 || /cannot|illegal|person|unsigned/i.test(JSON.stringify(data)),
  },
  {
    name: 'blank-sign-refused',
    post: '/sign',
    body: {id: 'case-arena-2020-06-02', name: '   '},
    expectStatus: (status, data) => status >= 400 || /empty|person|sign/i.test(JSON.stringify(data)),
  },
  {
    name: 'public-calls',
    get: '/calls',
    expect: (rows) => Array.isArray(rows) && rows.length >= 5,
  },
]

async function run() {
  const results = []
  for (const c of cases) {
    const t0 = Date.now()
    try {
      if (c.get) {
        const res = await fetch(BASE + c.get)
        const data = await res.json()
        const ok = c.expect(data)
        results.push({name: c.name, ok, ms: Date.now() - t0})
      } else if (c.post) {
        const res = await fetch(BASE + c.post, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(c.body),
        })
        const data = await res.json().catch(() => ({}))
        const ok = c.expectStatus(res.status, data)
        results.push({name: c.name, ok, ms: Date.now() - t0, note: data.error || data.state || ''})
      } else {
        const res = await fetch(BASE + '/ask', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({q: c.q}),
        })
        const data = await res.json()
        const ok = c.expect(data)
        results.push({
          name: c.name,
          ok,
          ms: Date.now() - t0,
          note: (data.answer || '').slice(0, 80),
        })
      }
    } catch (e) {
      results.push({name: c.name, ok: false, ms: Date.now() - t0, note: String(e.message || e)})
    }
    console.log(results.at(-1).ok ? 'ok' : 'FAIL', results.at(-1).ms + 'ms', c.name, results.at(-1).note || '')
  }
  const passed = results.filter((r) => r.ok).length
  const out = {
    ranAt: new Date().toISOString(),
    base: BASE,
    passed,
    failed: results.length - passed,
    total: results.length,
    results,
  }
  const {mkdirSync, writeFileSync} = await import('node:fs')
  mkdirSync(new URL('../demo', import.meta.url), {recursive: true})
  writeFileSync(new URL('../demo/qa-battery.json', import.meta.url), JSON.stringify(out, null, 2))
  console.log(`\nQA ${passed}/${results.length}`)
  if (passed < results.length) process.exit(1)
}

run()
