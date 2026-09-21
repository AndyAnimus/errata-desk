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
    name: 'french-arena',
    q: "Deux jours avant qu'Arena change, est-ce que je paie 3 ou je joue depuis l'extérieur ?",
    expect: (d) =>
      d.platform === 'arena' &&
      d.date === '2020-06-02' &&
      (/extérieur|outside|cast/i.test(d.answer || '') || /extérieur|outside/i.test(JSON.stringify(d.inForce || []))),
  },
  {
    name: 'german-arena',
    q: 'Zwei Tage bevor Arena umgestellt hat: zahle ich 3 oder spiele ich von außerhalb?',
    expect: (d) =>
      d.platform === 'arena' &&
      d.date === '2020-06-02' &&
      (/außerhalb|outside|cast/i.test(d.answer || '') || /außerhalb|outside/i.test(JSON.stringify(d.inForce || []))),
  },
  {
    name: 'fires-arena-june2',
    q: 'On Arena, June 2 2020, is Fires of Invention banned in Standard?',
    expect: (d) =>
      d.subject === 'fires-of-invention' &&
      d.date === '2020-06-02' &&
      /legal|noch|aún|encore|until/i.test(d.answer + JSON.stringify(d.inForce || [])),
  },
  {
    name: 'oko-arena-march11',
    q: 'On Arena, March 11 2020, is Oko banned in Historic?',
    expect: (d) => d.subject === 'oko-thief-of-crowns' && d.date === '2020-03-11' && /suspended|suspendu/i.test(d.answer || ''),
  },
  {
    name: 'golos-arena-march11',
    q: 'On Arena, March 11 2020, is Golos banned in Brawl?',
    expect: (d) => d.date === '2020-03-11' && /legal|légal|until|horloge/i.test(d.answer || ''),
  },
  {
    name: 'winota-brawl-may19-de',
    q: 'Ist Winota am 19. Mai 2020 in Brawl auf Arena gebannt?',
    expect: (d) => d.date === '2020-05-19' && d.platform === 'arena' && /legal|noch/i.test(d.answer || ''),
  },
  {
    name: 'lurrus-legacy-may18',
    q: 'On paper, May 18 2020, is Lurrus banned in Legacy?',
    expect: (d) => d.date === '2020-05-18' && d.platform === 'tabletop' && /banned in legacy/i.test(d.answer || ''),
  },
  {
    name: 'zirda-legacy-may18',
    q: 'On paper, May 18 2020, is Zirda banned in Legacy?',
    expect: (d) => d.date === '2020-05-18' && /banned in legacy/i.test(d.answer || ''),
  },
  {
    name: 'drannith-brawl-may20',
    q: 'On Arena, May 20 2020, is Drannith Magistrate banned in Brawl?',
    expect: (d) => d.date === '2020-05-20' && /legal|until/i.test(d.answer || ''),
  },
  {
    name: 'nexus-july15',
    q: 'On Arena, July 15 2020, is Nexus of Fate banned in Historic?',
    expect: (d) => d.date === '2020-07-15' && /legal|until/i.test(d.answer || ''),
  },
  {
    name: 'agent-historic-july15',
    q: 'On Arena, July 15 2020, is Agent of Treachery suspended in Historic?',
    expect: (d) => d.date === '2020-07-15' && /suspended/i.test(d.answer || ''),
  },
  {
    name: 'agent-historic-july16',
    q: 'On Arena, July 16 2020, is Agent of Treachery banned in Historic?',
    expect: (d) => d.date === '2020-07-16' && /banned in historic/i.test(d.answer || ''),
  },
  {
    name: 'burning-tree-july16',
    q: 'On Arena, July 16 2020, is Burning-Tree Emissary suspended in Historic?',
    expect: (d) => d.date === '2020-07-16' && /suspended/i.test(d.answer || ''),
  },
  {
    name: 'arcum-modern-july13',
    q: "On paper, July 13 2020, is Arcum's Astrolabe banned in Modern?",
    expect: (d) => d.date === '2020-07-13' && d.platform === 'tabletop' && /banned in modern/i.test(d.answer || ''),
  },
  {
    name: 'expedition-pauper-july13',
    q: 'On paper, July 13 2020, is Expedition Map banned in Pauper?',
    expect: (d) => d.date === '2020-07-13' && /banned in pauper/i.test(d.answer || ''),
  },
  {
    name: 'oath-pioneer-july13',
    q: 'On paper, July 13 2020, is Oath of Nissa unbanned in Pioneer?',
    expect: (d) => d.date === '2020-07-13' && /unbanned|legal/i.test(d.answer || ''),
  },
  {
    name: 'growth-spiral-aug2-es',
    q: 'El 2 de agosto de 2020, en papel, ¿Growth Spiral está prohibido en Standard?',
    expect: (d) => d.date === '2020-08-02' && d.platform === 'tabletop' && /legal|aún|hasta/i.test(d.answer || ''),
  },
  {
    name: 'cauldron-aug3',
    q: 'On Arena, August 3 2020, is Cauldron Familiar banned in Standard?',
    expect: (d) => d.date === '2020-08-03' && /banned in standard/i.test(d.answer || ''),
  },
  {
    name: 'kethis-aug2',
    q: 'On paper, August 2 2020, is Kethis banned in Pioneer?',
    expect: (d) => d.date === '2020-08-02' && /legal|until/i.test(d.answer || ''),
  },
  {
    name: 'inverter-aug3',
    q: 'On paper, August 3 2020, is Inverter of Truth banned in Pioneer?',
    expect: (d) => d.date === '2020-08-03' && /banned in pioneer/i.test(d.answer || ''),
  },
  {
    name: 'breach-legacy-march10',
    q: 'On paper, March 10 2020, is Underworld Breach banned in Legacy?',
    expect: (d) => d.date === '2020-03-10' && /banned in legacy/i.test(d.answer || ''),
  },
  {
    name: 'breach-pioneer-aug3',
    q: 'On paper, August 3 2020, is Underworld Breach banned in Pioneer?',
    expect: (d) => d.date === '2020-08-03' && /banned in pioneer/i.test(d.answer || ''),
  },
  {
    name: 'once-modern-march10',
    q: 'On paper, March 10 2020, is Once Upon a Time banned in Modern?',
    expect: (d) => d.date === '2020-03-10' && /banned in modern/i.test(d.answer || ''),
  },
  {
    name: 'teferi-standard-aug3-fr',
    q: 'Le 3 août 2020, sur la table, Teferi est-il banni en Standard ?',
    expect: (d) => d.date === '2020-08-03' && d.platform === 'tabletop' && /banni en standard/i.test(d.answer || ''),
  },
  {
    name: 'wilderness-historic-aug3-de',
    q: 'Ist Wilderness Reclamation am 3. August 2020 im Historic auf Arena suspendiert?',
    expect: (d) => d.date === '2020-08-03' && d.platform === 'arena' && /suspendiert|suspended/i.test(d.answer || ''),
  },
  {
    name: 'uro-sep28',
    q: 'On Arena, September 28 2020, is Uro banned in Standard?',
    expect: (d) => d.date === '2020-09-28' && /banned in standard/i.test(d.answer || ''),
  },
  {
    name: 'omnath-historic-oct12',
    q: 'On Arena, October 12 2020, is Omnath suspended in Historic?',
    expect: (d) => d.date === '2020-10-12' && /suspended in historic/i.test(d.answer || ''),
  },
  {
    name: 'omnath-brawl-oct12',
    q: 'On Arena, October 12 2020, is Omnath banned in Brawl?',
    expect: (d) => d.date === '2020-10-12' && /banned in brawl/i.test(d.answer || ''),
  },
  {
    name: 'field-unban-march12',
    q: 'On Arena, March 12 2020, is Field of the Dead legal in Historic?',
    expect: (d) => d.date === '2020-03-12' && /unbanned|legal/i.test(d.answer || ''),
  },
  {
    name: 'oko-march11-fr',
    q: 'Le 11 mars 2020, sur Arena, Oko est-il suspendu en Historique ?',
    expect: (d) => d.date === '2020-03-11' && /suspendu/i.test(d.answer || ''),
  },
  {
    name: 'sources-mcp',
    q: 'two days before Arena switched',
    expect: (d) => (d.tools || []).some((t) => /errata-sources|sourceDoc/i.test(t.name + ' ' + (t.detail || ''))),
  },
  {
    name: 'public-calls',
    get: '/calls',
    expect: (rows) => Array.isArray(rows) && rows.length >= 5,
  },
  {
    name: 'lake-claims',
    abs: 'https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=count(*[_type==%22rulesClaim%22])',
    expect: (d) => Number(d.result) >= 100,
  },
  {
    name: 'lake-sources',
    abs: 'https://gsu7qzk9.api.sanity.io/v2021-10-21/data/query/production?query=count(*[_type==%22sourceDoc%22])',
    expect: (d) => Number(d.result) >= 8,
  },
]

async function run() {
  const results = []
  for (const c of cases) {
    const t0 = Date.now()
    try {
      if (c.abs) {
        const res = await fetch(c.abs)
        const data = await res.json()
        const ok = c.expect(data)
        results.push({name: c.name, ok, ms: Date.now() - t0, note: String(data.result ?? '')})
      } else if (c.get) {
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
