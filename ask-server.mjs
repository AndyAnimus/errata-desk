import {createServer} from 'node:http'
import {readFileSync} from 'node:fs'
import {assertTransition} from './workflow.mjs'
import {cardAliases} from './scripts/volume-data.mjs'

const OLLAMA = 'http://127.0.0.1:11434/api/chat'
const MODEL = 'qwen2.5:7b-instruct-q4_K_M'
const PROJECT = 'gsu7qzk9'
const DATASET = 'production'
const MCP = `https://api.sanity.io/v2026-03-03/context/mcp/${PROJECT}/${DATASET}/errata-desk?embeddings=true`
const MCP_SIGN = `https://api.sanity.io/v2026-03-03/context/mcp/${PROJECT}/${DATASET}/errata-sign`
const MCP_SOURCES = `https://api.sanity.io/v2026-03-03/context/mcp/${PROJECT}/${DATASET}/errata-sources`

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

async function mcp(name, args = {}, url = MCP) {
  const res = await fetch(url, {
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
  if (/\bpaper\b|\bpapel\b|\bpapier\b|\bmesa\b|\btisch\b|\btabletop\b|at the table|in person|kitchen|sur (?:la )?table/.test(low)) {
    return 'tabletop'
  }
  return null
}

function detectLang(text) {
  const low = text.toLowerCase()
  if (/[äöüß]|\b(zwei|tage|bevor|zahle|spiele|außerhalb|verboten|suspendiert|gebannt|gefäh)|\bist\b/.test(low)) return 'de'
  if (/[àâçéèêëïôùû]|\b(jours?|avant|payez|jouez|banni|est-il|sur arena|compagnon)/.test(low)) return 'fr'
  if (/[áéíóúñ¿¡]|\b(días|antes|pago|lanzo|prohibido|compañero)/.test(low)) return 'es'
  return 'en'
}

function pickValue(claim, lang) {
  if (!claim) return ''
  if (lang === 'fr' && claim.valueFr) return claim.valueFr
  if (lang === 'de' && claim.valueDe) return claim.valueDe
  if (lang === 'es' && claim.valueEs) return claim.valueEs
  return claim.value || ''
}

function localizeShell(lang, kind, bits) {
  const {platform, date, value} = bits
  if (lang === 'fr') {
    if (kind === 'bound') return `Décision enregistrée. Le ${date}, ${platform}: ${value}`
    if (kind === 'derived') return `Dérivé, pas encore verrouillé. Le ${date}, ${platform}: ${value}`
    if (kind === 'compare') return `Le ${date}, les trois tables ne sont pas sur la même phrase.`
  }
  if (lang === 'de') {
    if (kind === 'bound') return `Gespeicherte Entscheidung. Am ${date}, ${platform}: ${value}`
    if (kind === 'derived') return `Abgeleitet, noch nicht gebunden. Am ${date}, ${platform}: ${value}`
    if (kind === 'compare') return `Am ${date} stehen die drei Tische nicht auf demselben Satz.`
  }
  if (lang === 'es') {
    if (kind === 'bound') return `Decisión guardada. El ${date}, ${platform}: ${value}`
    if (kind === 'derived') return `Derivado, aún sin fijar. El ${date}, ${platform}: ${value}`
    if (kind === 'compare') return `El ${date} las tres mesas no están en la misma frase.`
  }
  if (kind === 'bound') return `Standing ruling in the lake, not a fresh guess. On ${date}, ${platform}: ${value}`
  if (kind === 'derived') return `Derived, not yet ruled. On ${date}, ${platform}: ${value}`
  return `On ${date} the three tables are not on the same sentence.`
}

function banSubject(text) {
  const low = text.toLowerCase()
  for (const [alias, subject] of cardAliases()) {
    if (low.includes(alias)) return subject
  }
  return null
}

function formatOf(text) {
  const low = text.toLowerCase()
  if (/historic|historique|histórico|historico|historisch/.test(low)) return 'legalInHistoric'
  if (/\bbrawl\b/.test(low)) return 'legalInBrawl'
  if (/\bpioneer\b/.test(low)) return 'legalInPioneer'
  if (/\bmodern\b|\bmoderne\b|\bmoderno\b/.test(low)) return 'legalInModern'
  if (/\blegacy\b|\blegado\b/.test(low)) return 'legalInLegacy'
  if (/\bvintage\b/.test(low)) return 'legalInVintage'
  if (/\bpauper\b/.test(low)) return 'legalInPauper'
  if (/\bstandard\b|\bestándar\b|\bestandar\b/.test(low)) return 'legalInStandard'
  return null
}

function resolveKnown(text) {
  const low = text.toLowerCase()
  const words = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    uno: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    zwei: 2,
    drei: 3,
    vier: 4,
    un: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
  }
  const rel = low.match(
    /(\d+|one|two|three|four|uno|dos|tres|cuatro|zwei|drei|vier|un|deux|trois|quatre)\s+(?:días?|dias?|days?|tage?|jours?)\s+(?:antes\s+de\s+(?:que\s+)?|before\s+|bevor\s+|avant\s+(?:qu['’]?e?\s*|que\s+)?)(arena|mtga|tabletop|paper|mtgo|magic online|mesa|papel|umgestellt|chang)/,
  )
  if (rel) {
    const n = words[rel[1]] || Number(rel[1])
    const platform = platformOf(rel[2]) || platformOf(low) || 'arena'
    if (platform && Number.isFinite(n)) {
      return {
        inScope: true,
        platform,
        date: addDays(CLOCKS[platform], -n),
        reading: `${n} day${n === 1 ? '' : 's'} before ${platform} switched (${CLOCKS[platform]})`,
      }
    }
  }
  // Messy FR/DE/ES: "deux jours avant qu Arena change" / "zwei Tage bevor Arena…"
  const relLoose = low.match(
    /(\d+|one|two|three|four|uno|dos|tres|cuatro|zwei|drei|vier|un|deux|trois|quatre)\s+(?:días?|dias?|days?|tage?|jours?)\s+(?:antes|before|bevor|avant)\b/,
  )
  if (relLoose) {
    const n = words[relLoose[1]] || Number(relLoose[1])
    const platform = platformOf(low) || 'arena'
    if (Number.isFinite(n)) {
      return {
        inScope: true,
        platform,
        date: addDays(CLOCKS[platform], -n),
        reading: `${n} day${n === 1 ? '' : 's'} before ${platform} switched (${CLOCKS[platform]})`,
      }
    }
  }
  if (/day before arena|día antes.*arena|dia antes.*arena/.test(low)) {
    return {
      inScope: true,
      platform: 'arena',
      date: addDays(CLOCKS.arena, -1),
      reading: 'the day before Arena switched',
    }
  }
  const dated =
    low.match(/\b(?:june|jun|junio|juin|juni)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*|\s+)(2020)\b/) ||
    low.match(/\b(?:le\s+)?(\d{1,2})\s+(?:juin|junio|juni)\s+(2020)\b/) ||
    low.match(/\b(2020)-0?6-0?(\d{1,2})\b/)
  if (dated) {
    let d
    if (dated[0].startsWith('2020') || /^2020/.test(dated[1])) {
      // iso or weird
      if (dated[0].includes('-')) d = `2020-06-${String(Number(dated[2])).padStart(2, '0')}`
      else d = `2020-06-${String(Number(dated[1])).padStart(2, '0')}`
    } else if (/^\d{1,2}$/.test(dated[1]) && dated[2] === '2020') {
      d = `2020-06-${String(Number(dated[1])).padStart(2, '0')}`
    } else {
      d = `2020-06-${String(Number(dated[1])).padStart(2, '0')}`
    }
    const platform =
      platformOf(low) || (/on paper|paper|table|papel|mesa/.test(low) ? 'tabletop' : null)
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
  await openCase({platform, date, claimId, reading, value})
  return doc
}

async function mutate(mutations) {
  const res = await fetch(`https://${PROJECT}.api.sanity.io/v2021-06-07/data/mutate/${DATASET}`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({mutations}),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.error?.description || 'mutate failed')
  return body
}

async function openCase({platform, date, claimId, reading, value}) {
  const id = `case-${platform}-${date}`
  const now = new Date().toISOString()
  const doc = {
    _id: id,
    _type: 'deskCase',
    title: `${platform} ${date}`,
    platform,
    date,
    claimId,
    reading: reading || '',
    value,
    state: 'awaitingSignature',
    transitions: [
      {_key: 'asked', at: now, from: 'asked', to: 'derived', actor: 'agent'},
      {_key: 'hold', at: now, from: 'derived', to: 'awaitingSignature', actor: 'agent'},
    ],
  }
  await mutate([{createIfNotExists: doc}])
  return doc
}

async function loadCase(id) {
  const groq = `*[_id=="${id}"][0]`
  const data = await fetch(
    `https://${PROJECT}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=` + encodeURIComponent(groq),
    {headers: {Authorization: `Bearer ${TOKEN}`}},
  ).then((r) => r.json())
  return data.result
}

async function signCase({id, name}) {
  const who = String(name || '').trim()
  if (!who) throw new Error('a person has to sign. decidedBy stays empty')
  const row = await loadCase(id)
  if (!row) throw new Error('no case')
  assertTransition(row.state, 'signed', 'person')
  const now = new Date().toISOString()
  const transitions = [
    ...(row.transitions || []),
    {_key: 'sign-' + Date.now(), at: now, from: row.state, to: 'signed', actor: 'person'},
  ]
  await mutate([
    {
      patch: {
        id,
        set: {state: 'signed', decidedBy: who, decidedAt: now, transitions},
      },
    },
  ])
  return {id, state: 'signed', decidedBy: who, decidedAt: now}
}

async function advanceCase({id, to, actor}) {
  const row = await loadCase(id)
  if (!row) throw new Error('no case')
  assertTransition(row.state, to, actor)
  if (to === 'signed') throw new Error('decidedBy stays empty until a person signs')
  const now = new Date().toISOString()
  const transitions = [
    ...(row.transitions || []),
    {_key: 'step-' + Date.now(), at: now, from: row.state, to, actor},
  ]
  await mutate([
    {patch: {id, set: {state: to, transitions}}},
  ])
  return {id, state: to, decidedBy: row.decidedBy || null, decidedAt: row.decidedAt || null}
}

async function attachDecision(result) {
  const targets = result.compare?.length
    ? result.compare
    : result.platform && result.date
      ? [{platform: result.platform, date: result.date}]
      : []
  const decisions = []
  for (const t of targets) {
    const q = `*[_type=="deskCase" && platform=="${t.platform}" && date=="${t.date}"][0]{_id,state,decidedBy,decidedAt,value}`
    try {
      const raw = await mcp('groq_query', {query: q}, MCP_SIGN)
      const row = unpack(raw)
      const doc = Array.isArray(row) ? row[0] : row
      decisions.push({
        platform: t.platform,
        date: t.date,
        _id: doc?._id || null,
        state: doc?.state || null,
        decidedBy: doc?.decidedBy || null,
        decidedAt: doc?.decidedAt || null,
        signed: Boolean(doc?.decidedBy && doc?.decidedAt),
      })
    } catch (e) {
      decisions.push({platform: t.platform, date: t.date, error: String(e.message || e), signed: false})
    }
  }
  result.decisions = decisions
  result.tools = result.tools || []
  result.tools.push({name: 'errata-sign', detail: 'second MCP · ' + MCP_SIGN})
  return result
}

function wantsCompare(text) {
  return /all three|every table|each table|each clock|side by side|disagree|which table/.test(text.toLowerCase())
}

function askedDate(text) {
  const low = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  const iso = low.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const months = {
    january: 1, janvier: 1, januar: 1, enero: 1,
    february: 2, fevrier: 2, februar: 2, febrero: 2,
    march: 3, mars: 3, marz: 3, marzo: 3,
    april: 4, avril: 4, abril: 4,
    may: 5, mai: 5, mayo: 5,
    june: 6, jun: 6, juin: 6, juni: 6, junio: 6,
    july: 7, juillet: 7, juli: 7, julio: 7,
    august: 8, aout: 8, agosto: 8,
    september: 9, septembre: 9, septiembre: 9,
    october: 10, octobre: 10, oktober: 10, octubre: 10,
    november: 11, novembre: 11, noviembre: 11,
    december: 12, decembre: 12, dezember: 12, diciembre: 12,
  }
  const names = Object.keys(months).join('|')
  const pad = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(Number(d)).padStart(2, '0')}`
  let m = low.match(new RegExp(`\\b(${names})\\s+(\\d{1,2})(?!\\d)(?:st|nd|rd|th)?(?:\\s*,?\\s*(20\\d{2}))?`))
  if (m) return pad(m[3] || '2020', months[m[1]], m[2])
  m = low.match(new RegExp(`\\b(\\d{1,2})\\.?\\s+(?:de\\s+)?(${names})(?:\\s+(?:de\\s+)?(20\\d{2}))?`))
  if (m) return pad(m[3] || '2020', months[m[2]], m[1])
  return null
}

function companionNamed(text) {
  const low = text.toLowerCase()
  const names = {
    lurrus: 'Lurrus of the Dream-Den',
    yorion: 'Yorion, Sky Nomad',
    obosh: 'Obosh, the Preypiercer',
    gyruda: 'Gyruda, Doom of Depths',
    keruga: 'Keruga, the Macrosage',
    umori: 'Umori, the Collector',
    jegantha: 'Jegantha, the Wellspring',
    kaheera: 'Kaheera, the Orphanguard',
    zirda: 'Zirda, the Dawnwaker',
    lutri: 'Lutri, the Spellchaser',
  }
  const hit = Object.keys(names).find((k) => low.includes(k))
  return hit ? names[hit] : null
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
  const lang = detectLang(text)
  const ban = banSubject(text)
  const known = resolveKnown(text)
  const whoEarly = companionNamed(text)
  const compareDate = wantsCompare(text) ? askedDate(text) || known?.date : null
  const parsed =
    known || compareDate || whoEarly || ban
      ? {inScope: true, reading: whoEarly || ban || ''}
      : await readQuestion(text)
  const platform =
    known?.platform || (['tabletop', 'arena', 'mtgo'].includes(parsed.platform) ? parsed.platform : null)
  const date = known?.date || (/^\d{4}-\d{2}-\d{2}$/.test(parsed.date || '') ? parsed.date : null)

  const ctx = await mcp('initial_context', {})
  tools.push({
    name: 'initial_context',
    detail: typeof ctx.text === 'string' ? ctx.text.slice(0, 180) : 'schema + instructions loaded',
  })

  const clocks = ban
    ? null
    : await mcp('array_field_reader', {
        mode: 'range',
        documentId: 'rules-change-companion',
        field: 'clocks',
        range: {startIndex: 0, endIndex: 3},
      })
  if (!ban) {
    tools.push({
      name: 'array_field_reader',
      detail: 'rules-change-companion.clocks[0…3]',
    })
  }

  try {
    const srcQ = `*[_type=="sourceDoc"]|order(title)[0...3]{title,sourceUrl,about}`
    const srcRaw = await mcp('groq_query', {query: srcQ}, MCP_SOURCES)
    tools.push({name: 'errata-sources', detail: 'primary-source MCP · ' + MCP_SOURCES})
    const src = unpack(srcRaw)
    if (Array.isArray(src) && src[0]) {
      tools.push({name: 'sourceDoc', detail: src[0].title + ' · ' + (src[0].sourceUrl || '')})
    }
  } catch (e) {
    tools.push({name: 'errata-sources', detail: String(e.message || e).slice(0, 120)})
  }

  let similar = []
  try {
    const safe = text.replace(/["\\]/g, ' ').slice(0, 180)
    const semQ = `*[_type in ["workedCall","rulesClaim","sourceDoc"]] | score(text::semanticSimilarity("${safe}")) | order(_score desc)[0...3]{_id,_type,title,finding,value,platform,_score}`
    const semRaw = await mcp('groq_query', {query: semQ})
    tools.push({name: 'groq_query', detail: 'text::semanticSimilarity'})
    const sem = unpack(semRaw)
    similar = Array.isArray(sem) ? sem : []
  } catch {
    tools.push({name: 'groq_query', detail: 'semantic search not ready'})
  }

  if (ban && (platform || date || compareDate || askedDate(text) || platformOf(text.toLowerCase()))) {
    const day = date || compareDate || askedDate(text) || known?.date
    const wanted = formatOf(text)
    const arenaOnly = wanted === 'legalInHistoric' || wanted === 'legalInBrawl' || !wanted
    const plat =
      platform ||
      platformOf(text.toLowerCase()) ||
      (arenaOnly ? 'arena' : 'tabletop')
    if (day) {
      const predFilter = wanted ? ` && predicate=="${wanted}"` : ''
      const claimsQ = `*[_type=="rulesClaim" && subject=="${ban}" && platform=="${plat}"${predFilter}]{_id,status,predicate,value,valueFr,valueDe,valueEs,quote,effectiveFrom,effectiveUntil,sourceTitle,sourceUrl,clockDoc}`
      const claimsRaw = await mcp('groq_query', {query: claimsQ})
      tools.push({name: 'groq_query', detail: claimsQ})
      const rows = unpack(claimsRaw)
      const list = Array.isArray(rows) ? rows : []
      const {inForce, notInForce} = split(list, day)
      const top = inForce[0]
      const clockDoc = top?.clockDoc || list[0]?.clockDoc || 'rules-change-standard-bans'
      const banClocks = await mcp('array_field_reader', {
        mode: 'range',
        documentId: clockDoc,
        field: 'clocks',
        range: {startIndex: 0, endIndex: 3},
      })
      tools.push({name: 'array_field_reader', detail: clockDoc + '.clocks'})
      const value = pickValue(top, lang)
      return {
        lang,
        reading: known?.reading || parsed.reading || ban,
        platform: plat,
        date: day,
        answer: localizeShell(lang, 'derived', {
          platform: plat,
          date: day,
          value: value || 'No claim covers this day.',
        }),
        inForce: inForce.map((c) => ({...c, value: pickValue(c, lang)})),
        notInForce: notInForce.map((c) => ({...c, value: pickValue(c, lang)})),
        tools,
        clocks: unpack(banClocks),
        similar,
        subject: ban,
        predicate: wanted || top?.predicate || null,
      }
    }
  }

  if (compareDate) {
    const predicate = ban ? 'legalInStandard' : 'bringIntoGame'
    const subjectFilter = ban ? ` && subject=="${ban}"` : ''
    const claimsQ = `*[_type=="rulesClaim" && predicate=="${predicate}"${subjectFilter}]{_id,platform,status,value,valueFr,valueDe,valueEs,quote,effectiveFrom,effectiveUntil,sourceTitle}`
    const claimsRaw = await mcp('groq_query', {query: claimsQ})
    tools.push({name: 'groq_query', detail: claimsQ})
    const rows = unpack(claimsRaw)
    const list = Array.isArray(rows) ? rows : []
    const lanes = ['tabletop', 'mtgo', 'arena'].map((platform) => {
      const mine = list.filter((c) => c.platform === platform)
      const {inForce} = split(mine, compareDate)
      return {
        platform,
        date: compareDate,
        value: pickValue(inForce[0], lang) || 'No claim covers this day.',
        quote: inForce[0]?.quote || '',
      }
    })
    return {
      lang,
      reading: `all three clocks on ${compareDate}`,
      date: compareDate,
      compare: lanes,
      answer: localizeShell(lang, 'compare', {platform: '', date: compareDate, value: ''}),
      inForce: [],
      notInForce: [],
      tools,
      clocks: unpack(clocks),
      similar,
    }
  }

  const who = companionNamed(text)
  if (who && !known) {
    const cardQ = `*[_type=="companionCard" && name=="${who}"][0]{name,imageUrl,oracleText,typeLine,scryfallUrl}`
    const noteQ = `*[_type=="cardRuling" && cardName=="${who}"]|order(publishedAt desc)[0...3]{publishedAt,comment,source}`
    const cardRaw = await mcp('groq_query', {query: cardQ})
    const noteRaw = await mcp('groq_query', {query: noteQ})
    tools.push({name: 'groq_query', detail: cardQ})
    tools.push({name: 'groq_query', detail: noteQ})
    const card = unpack(cardRaw)
    const notes = unpack(noteRaw)
    const oracle = card && !Array.isArray(card) ? card.oracleText : ''
    const restriction = String(oracle || '').split('\n')[0]
    return {
      reading: who,
      answer: restriction || `No companion card named ${who} is in the lake.`,
      card: card && !Array.isArray(card) ? card : null,
      notes: Array.isArray(notes) ? notes : [],
      inForce: [],
      notInForce: [],
      tools,
      clocks: unpack(clocks),
    }
  }

  if (!parsed.inScope) {
    return {
      reading: parsed.reading || 'Outside this desk.',
      answer: 'This desk knows companion procedure and the June 2020 Standard bans (Fires, Agent) across three clocks.',
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

  const claimsQ = `*[_type=="rulesClaim" && platform=="${platform}" && predicate=="bringIntoGame"]{_id,status,value,valueFr,valueDe,valueEs,quote,effectiveFrom,effectiveUntil,sourceTitle,sourceUrl}`
  const claimsRaw = await mcp('groq_query', {query: claimsQ})
  tools.push({name: 'groq_query', detail: claimsQ})
  const claims = unpack(claimsRaw)
  const list = Array.isArray(claims) ? claims : []
  const {inForce, notInForce} = split(list, date)
  const localizedIn = inForce.map((c) => ({...c, value: pickValue(c, lang)}))
  const localizedOut = notInForce.map((c) => ({...c, value: pickValue(c, lang)}))

  if (boundDoc && boundDoc.value) {
    const boundClaim =
      list.find((c) => c._id === boundDoc.claimId) || inForce[0] || null
    const boundValue = pickValue(boundClaim, lang) || boundDoc.value
    return {
      lang,
      reading: boundDoc.reading || known?.reading || parsed.reading,
      platform,
      date,
      bound: true,
      answer: localizeShell(lang, 'bound', {platform, date, value: boundValue}),
      inForce: localizedIn,
      notInForce: localizedOut,
      tools,
      clocks: unpack(clocks),
      similar,
    }
  }

  const top = localizedIn[0]
  return {
    lang,
    reading: known?.reading || parsed.reading,
    platform,
    date,
    bound: false,
    answer: localizeShell(lang, 'derived', {
      platform,
      date,
      value: top?.value || 'No claim covers this day.',
    }),
    inForce: localizedIn,
    notInForce: localizedOut,
    tools,
    clocks: unpack(clocks),
    similar,
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
  .board { width: 100%; height: auto; margin: .2rem 0 1rem; }
  .board .tick, .board .lane { fill: #9a917e; font-size: 12px; font-family: system-ui, sans-serif; }
  .board .old { fill: #6a3b2e; }
  .board .now { fill: #6f8f3a; }
  #needleLine { stroke: #f0c75e; stroke-width: 2; }
  #needleLabel { fill: #f0c75e; font-size: 13px; font-family: Georgia, serif; }
  .calls { display: flex; flex-wrap: wrap; gap: .45rem; margin: 0 0 1rem; }
  .calls button { background: transparent; color: var(--ink); border: 1px solid var(--line); border-radius: 999px; padding: .35rem .7rem; font-size: .78rem; }
  .portrait-row { display: flex; gap: .8rem; align-items: flex-start; }
  .portrait-row img { width: 92px; border-radius: 8px; }
  @media (max-width: 900px) {
    .calls button { font-size: .72rem; }
    .clocks { grid-template-columns: 1fr; }
    h1 { font-size: 1.85rem; }
  }
</style>
<body>
  <main class="wrap">
    <p class="kicker">Sanity Context · Path One</p>
    <h1>Errata Desk</h1>
    <p class="lede">One sentence. Three clocks. Companion procedure and the June 2020 Standard bans share the same announcement — and not the same effective day. Ask in English, French, German, or Spanish. The primary source is its own MCP.</p>

    <svg class="board" id="board" viewBox="0 0 720 210" role="img" aria-label="Three clocks, one week">
      <text x="90" y="22" class="tick">Jun 1</text>
      <text x="250" y="22" class="tick">Jun 2</text>
      <text x="410" y="22" class="tick">Jun 3</text>
      <text x="570" y="22" class="tick">Jun 4</text>
      <g id="lane-tabletop" transform="translate(0,40)">
        <text x="8" y="18" class="lane">Table</text>
        <rect x="70" y="4" width="620" height="16" rx="8" class="old"/>
        <rect x="90" y="4" width="600" height="16" rx="8" class="now"/>
      </g>
      <g id="lane-mtgo" transform="translate(0,88)">
        <text x="8" y="18" class="lane">MTGO</text>
        <rect x="70" y="4" width="620" height="16" rx="8" class="old"/>
        <rect x="410" y="4" width="280" height="16" rx="8" class="now"/>
      </g>
      <g id="lane-arena" transform="translate(0,136)">
        <text x="8" y="18" class="lane">Arena</text>
        <rect x="70" y="4" width="620" height="16" rx="8" class="old"/>
        <rect x="570" y="4" width="120" height="16" rx="8" class="now"/>
      </g>
      <line id="needleLine" x1="410" y1="30" x2="410" y2="176" />
      <text id="needleLabel" x="410" y="198" text-anchor="middle">Jun 3 · three answers</text>
    </svg>

    <div class="calls" id="calls"></div>

    <label for="q">Ask any day around the switch</label>
    <textarea id="q">two days before Arena switched, do I pay 3 or cast it from outside the game?</textarea>
    <div class="actions">
      <button id="go">Ask the lake</button>
      <button class="ghost" id="sample" type="button">Paper on June 2</button>
      <button class="ghost" id="sampleFr" type="button">FR · Arena −2</button>
      <button class="ghost" id="sampleDe" type="button">DE · Arena −2</button>
      <button class="ghost" id="sampleBan" type="button">Fires · Arena June 2</button>
      <span class="chip" id="status"><b>idle</b> · Context MCP ready</span>
    </div>
    <div id="out"></div>
    <footer>
      Studio <a href="https://luis-errata-desk.sanity.studio/" target="_blank" rel="noreferrer">luis-errata-desk.sanity.studio</a>
      · Context <code>errata-desk</code>, <code>errata-sign</code>, <code>errata-sources</code>
      · <a href="check">public check</a> · EN/FR/DE/ES
    </footer>
  </main>
<script>
let last = null
const SWITCH = {tabletop:'2020-06-01', mtgo:'2020-06-03', arena:'2020-06-04'}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

function setNeedle(date) {
  const line = document.getElementById('needleLine')
  const label = document.getElementById('needleLabel')
  if (!line || !date) return
  const day = Number(date.slice(-2))
  const x = day <= 1 ? 90 : day === 2 ? 250 : day === 3 ? 410 : day >= 4 ? 570 : 250
  line.setAttribute('x1', x)
  line.setAttribute('x2', x)
  const names = {1:'Jun 1',2:'Jun 2',3:'Jun 3',4:'Jun 4'}
  label.setAttribute('x', x)
  label.textContent = (names[day] || date) + ' · three answers'
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

function decisionBox(list) {
  if (!list || !list.length) return ''
  return list.map(d => {
    const empty = !d.signed
    return '<section class="panel ' + (empty ? 'stale' : 'bound') + '">' +
      '<p class="eyebrow">errata-sign · ' + esc(d.platform || '') + '</p>' +
      '<p class="answer">' + (empty ? 'Unsigned' : 'Signed') + '</p>' +
      '<p class="muted">decidedBy: ' + esc(d.decidedBy || '—') + ' · decidedAt: ' + esc(d.decidedAt || '—') +
      (d.state ? ' · ' + esc(d.state) : '') + '</p>' +
      (empty && d._id
        ? '<div class="actions"><input id="signer" placeholder="Sign as" style="background:#0e0c0a;color:inherit;border:1px solid var(--line);border-radius:999px;padding:.55rem .8rem">' +
          '<button class="bind" id="sign" data-case="' + esc(d._id) + '">Sign</button></div>'
        : '') +
      '</section>'
  }).join('')
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
    setNeedle(last.date)
    const boundClass = last.bound ? ' bound' : ''
    const lanes = (last.compare || []).map(l =>
      '<section class="panel force"><p class="eyebrow">' + esc(l.platform) + '</p><p class="answer">' + esc(l.value) + '</p></section>'
    ).join('')
    out.innerHTML =
      '<section class="panel' + boundClass + '">' +
        '<p class="eyebrow">' + (last.bound ? 'Standing ruling' : 'Derived call') + '</p>' +
        (last.card && last.card.imageUrl
          ? '<div class="portrait-row"><img alt="" src="' + esc(last.card.imageUrl) + '"><div><p class="answer">' + esc(last.answer) + '</p><p class="muted">' + esc(last.card.name) + '</p></div></div>'
          : '<p class="answer">' + esc(last.answer) + '</p>') +
        '<p class="muted">' + esc(last.reading || '') +
          (last.platform ? ' · ' + esc(last.platform) + ' @ ' + esc(last.date) : '') +
          (last.bound ? ' · already bound' : '') + '</p>' +
      '</section>' +
      lanes +
      claimCard('In force on this clock', last.inForce, !last.bound, 'force') +
      claimCard('Also in the lake, not in force', last.notInForce, !last.bound, 'stale') +
      decisionBox(last.decisions) +
      (last.notes && last.notes.length
        ? '<section class="panel"><p class="eyebrow">Dated card rulings</p>' + last.notes.map(n =>
            '<div class="claim"><p>' + esc(n.comment) + '</p><p class="muted">' + esc(n.publishedAt) + ' · ' + esc(n.source) + '</p></div>'
          ).join('') + '</section>'
        : '') +
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
    const sign = out.querySelector('#sign')
    if (sign) sign.onclick = async () => {
      const name = (out.querySelector('#signer') || {}).value || ''
      sign.disabled = true
      status.innerHTML = '<b>signing</b> · person only'
      const res = await fetch('sign', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: sign.dataset.case, name})
      })
      const data = await res.json()
      if (!res.ok) {
        status.innerHTML = '<b>unsigned</b> · ' + esc(data.error || 'not signed')
        sign.disabled = false
        return
      }
      await ask()
    }
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
document.getElementById('sampleFr').onclick = () => {
  document.getElementById('q').value = 'Deux jours avant qu’Arena change, est-ce que je paie 3 ou je joue depuis l’extérieur ?'
  ask()
}
document.getElementById('sampleDe').onclick = () => {
  document.getElementById('q').value = 'Zwei Tage bevor Arena umgestellt hat: zahle ich 3 oder spiele ich von außerhalb?'
  ask()
}
document.getElementById('sampleBan').onclick = () => {
  document.getElementById('q').value = 'On Arena, June 2 2020, is Fires of Invention banned in Standard?'
  ask()
}

fetch('calls')
  .then(r => r.json())
  .then(data => {
    const box = document.getElementById('calls')
    const rows = Array.isArray(data) ? data : []
    box.innerHTML = rows.map(c =>
      '<button type="button" data-q="' + esc(c.question) + '">' + esc(c.title) + '</button>'
    ).join('')
    box.querySelectorAll('button').forEach(btn => btn.onclick = () => {
      document.getElementById('q').value = btn.dataset.q
      ask()
    })
  })
  .catch(() => {})
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
  const pathOnly = url.split('?')[0]
  if (pathOnly.startsWith('/sanity-api/')) {
      const target = 'https://gsu7qzk9.api.sanity.io' + pathOnly.slice('/sanity-api'.length) + (url.includes('?') ? '?' + url.split('?')[1] : '')
    try {
      const upstream = await fetch(target, {headers: {Accept: 'application/json'}})
      const buf = Buffer.from(await upstream.arrayBuffer())
      res.writeHead(upstream.status, {'Content-Type': upstream.headers.get('content-type') || 'application/json'})
      res.end(buf)
    } catch (e) {
      res.writeHead(502, {'Content-Type': 'text/plain'})
      res.end(String(e.message || e))
    }
    return
  }
  if (req.method === 'GET' && (pathOnly === '/app' || pathOnly.startsWith('/app/'))) {
    const rel = pathOnly === '/app' || pathOnly === '/app/' ? '/index.html' : pathOnly.slice('/app'.length)
    if (rel.includes('..')) {
      res.writeHead(400)
      res.end()
      return
    }
    const file = new URL('./app/dist' + (rel.startsWith('/') ? rel : '/' + rel), import.meta.url)
    try {
      const body = readFileSync(file)
      const type = rel.endsWith('.js') ? 'text/javascript' : rel.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8'
      res.writeHead(200, {'Content-Type': type})
      res.end(body)
    } catch {
      res.writeHead(404)
      res.end('app not built')
    }
    return
  }
  if (req.method === 'GET' && (url === '/needle' || url.startsWith('/needle?'))) {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
    res.end(readFileSync(new URL('./needle.html', import.meta.url)))
    return
  }
  if (req.method === 'GET' && url.startsWith('/calls')) {
    try {
      const groq = '*[_type=="workedCall"]|order(title){title,question,date,finding}'
      const data = await fetch(
        `https://${PROJECT}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=` + encodeURIComponent(groq),
      ).then((r) => r.json())
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify(data.result || []))
    } catch {
      res.writeHead(500, {'Content-Type': 'application/json'})
      res.end('[]')
    }
    return
  }
  if (req.method === 'GET' && url.startsWith('/check')) {
    try {
      const date = '2020-06-02'
      const claimsQ = `*[_type=="rulesClaim" && platform=="arena"]{platform,value,effectiveFrom,effectiveUntil,status}`
      const caseQ = `*[_id=="case-arena-2020-06-02"][0]{state,decidedBy,decidedAt}`
      const [claims, deskCase] = await Promise.all([
        fetch(`https://${PROJECT}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=` + encodeURIComponent(claimsQ)).then((r) => r.json()),
        fetch(`https://${PROJECT}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=` + encodeURIComponent(caseQ)).then((r) => r.json()),
      ])
      const rows = claims.result || []
      const inForce = rows.filter((c) => (!c.effectiveFrom || c.effectiveFrom <= date) && (!c.effectiveUntil || c.effectiveUntil > date))
      const notInForce = rows.filter((c) => !inForce.includes(c))
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(
        JSON.stringify({
          path: 'public-query',
          note: 'No Context token. Same Arena June 2 split the MCP would return.',
          date,
          inForce,
          notInForce,
          decision: deskCase.result || null,
          mcp: {rules: MCP, sign: MCP_SIGN, sources: MCP_SOURCES},
        }),
      )
    } catch (e) {
      res.writeHead(500, {'Content-Type': 'application/json'})
      res.end(JSON.stringify({error: String(e.message || e)}))
    }
    return
  }
  if (req.method === 'GET' && url.startsWith('/cards')) {
    try {
      const groq = '*[_type=="companionCard"]|order(name){name,imageUrl}'
      const data = await fetch(
        `https://${PROJECT}.api.sanity.io/v2021-10-21/data/query/${DATASET}?query=` + encodeURIComponent(groq),
      ).then((r) => r.json())
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify(data.result || []))
    } catch (e) {
      res.writeHead(500, {'Content-Type': 'application/json'})
      res.end('[]')
    }
    return
  }
  if (req.method === 'GET') {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'})
    res.end(page)
    return
  }
  try {
    if (req.method === 'POST' && url.startsWith('/ask')) {
      const body = await readBody(req)
      const result = await attachDecision(await answer(String(body.q || '')))
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify(result))
      return
    }
    if (req.method === 'POST' && url.startsWith('/sign')) {
      const body = await readBody(req)
      const doc = await signCase(body)
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify({ok: true, ...doc}))
      return
    }
    if (req.method === 'POST' && url.startsWith('/advance')) {
      const body = await readBody(req)
      const doc = await advanceCase(body)
      res.writeHead(200, {'Content-Type': 'application/json'})
      res.end(JSON.stringify({ok: true, ...doc}))
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
