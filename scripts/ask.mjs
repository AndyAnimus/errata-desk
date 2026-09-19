/**
 * Errata Desk agent.
 * Keyword search cannot answer this: the same sentence is true on one platform
 * and false on another, depending on the date. The agent only trusts claims
 * whose effective window covers the question.
 */
const projectId = 'gsu7qzk9'
const dataset = 'production'
const query = encodeURIComponent('*[_type=="rulesClaim"]')
const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/query/${dataset}?query=${query}`

const res = await fetch(url)
if (!res.ok) {
  console.error('query failed', res.status)
  process.exit(1)
}
const { result } = await res.json()
const claims = result || []

const questions = process.argv.slice(2)
const demos = questions.length
  ? [questions.join(' ')]
  : [
      'On June 2, 2020 on MTG Arena, do I pay 3 or cast my companion from outside the game?',
      'On June 2, 2020 at the table, do I pay 3 or cast my companion from outside the game?',
    ]

function parse(q) {
  const low = q.toLowerCase()
  const platform = low.includes('arena')
    ? 'arena'
    : low.includes('mtgo') || low.includes('magic online')
      ? 'mtgo'
      : 'tabletop'
  const months = {january:'01',february:'02',march:'03',april:'04',may:'05',june:'06',july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'}
  let date = '2020-06-02'
  const iso = q.match(/(\d{4}-\d{2}-\d{2})/)
  const named = q.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/)
  if (iso) date = iso[1]
  else if (named) {
    const mm = months[named[1].toLowerCase()]
    if (mm) date = `${named[3]}-${mm}-${named[2].padStart(2, '0')}`
  }
  return { platform, date, q }
}

function inForce(c, date) {
  if (c.effectiveFrom && date < c.effectiveFrom) return false
  if (c.effectiveUntil && date >= c.effectiveUntil) return false
  return true
}

for (const raw of demos) {
  const { platform, date, q } = parse(raw)
  const same = claims.filter((c) => c.platform === platform && c.predicate === 'bringIntoGame')
  const active = same.filter((c) => inForce(c, date))
  const inactive = same.filter((c) => !inForce(c, date))
  console.log('\nQ:', q)
  console.log('parsed:', platform, date)
  console.log('IN FORCE:')
  for (const c of active) {
    console.log(`- [${c.status}] ${c.value}`)
    console.log(`  quote: ${c.quote}`)
    console.log(`  source: ${c.sourceTitle}`)
    console.log(`  ${c.sourceUrl}`)
  }
  console.log('NOT IN FORCE (keyword search still returns these):')
  for (const c of inactive) {
    console.log(`- [${c.status}] ${c.effectiveFrom || '?'} .. ${c.effectiveUntil || 'open'} ${c.value}`)
  }
  if (!active.length) console.log('- no claim covers that date')
}

console.log('\nclaims in lake:', claims.length)
