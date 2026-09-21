/**
 * Primary-source rows from Wizards B&R announcements.
 * Dates and formats are the ones printed on those pages — no invented clocks.
 * Historic/Brawl are Arena-only. Pioneer/Modern/Legacy/Vintage/Pauper are tabletop + Magic Online.
 */

export const ANNOUNCEMENTS = [
  {
    id: '2020-03-09',
    title: 'March 9, 2020, Banned and Restricted Announcement',
    url: 'https://magic.wizards.com/en/news/announcements/march-9-2020-banned-and-restricted-announcement',
    author: 'Ian Duke',
    publishedAt: '2020-03-09',
    clocks: {tabletop: '2020-03-10', mtgo: '2020-03-10', arena: '2020-03-12'},
    excerpt: `Brawl: Golos, Tireless Pilgrim is banned.
Historic: Oko, Thief of Crowns; Once Upon a Time; and Veil of Summer move from suspended to banned. Field of the Dead moves from suspended to legal.
Legacy: Underworld Breach is banned.
Modern: Once Upon a Time is banned.
Tabletop Effective Date: March 10, 2020. Magic Online Effective Date: March 10, 2020. MTG Arena Effective Date: March 12, 2020.`,
  },
  {
    id: '2020-05-18',
    title: 'May 18, 2020, Banned and Restricted Announcement',
    url: 'https://magic.wizards.com/en/news/announcements/may-18-2020-banned-and-restricted-announcement',
    author: 'Ian Duke',
    publishedAt: '2020-05-18',
    clocks: {tabletop: '2020-05-18', mtgo: '2020-05-18', arena: '2020-05-21'},
    excerpt: `Brawl: Drannith Magistrate is banned. Winota, Joiner of Forces is banned.
Legacy: Lurrus of the Dream-Den is banned. Zirda, the Dawnwaker is banned.
Vintage: Lurrus of the Dream-Den is banned.
Tabletop Effective Date: May 18, 2020. Magic Online Effective Date: May 18, 2020. MTG Arena Effective Date: May 21, 2020.`,
  },
  {
    id: '2020-07-13',
    title: 'July 13, 2020, Banned and Restricted Announcement',
    url: 'https://magic.wizards.com/en/news/announcements/july-13-2020-banned-and-restricted-announcement-2020-07-13',
    author: 'Wizards of the Coast',
    publishedAt: '2020-07-13',
    clocks: {tabletop: '2020-07-13', mtgo: '2020-07-13', arena: '2020-07-16'},
    excerpt: `Historic: Agent of Treachery, Winota, Joiner of Forces, and Fires of Invention are banned (from suspended). Nexus of Fate is banned. Burning-Tree Emissary is suspended.
Pioneer: Oath of Nissa is unbanned.
Modern: Arcum's Astrolabe is banned.
Pauper: Expedition Map is banned. Mystic Sanctuary is banned.
Tabletop Effective Date: July 13, 2020. Magic Online Effective Date: July 13, 2020. MTG Arena effective date: July 16, 2020.`,
  },
  {
    id: '2020-08-03',
    title: 'August 3, 2020, Banned and Restricted Announcement',
    url: 'https://magic.wizards.com/en/news/announcements/august-8-2020-banned-and-restricted-announcement',
    author: 'Ian Duke',
    publishedAt: '2020-08-03',
    clocks: {tabletop: '2020-08-03', mtgo: '2020-08-03', arena: '2020-08-03'},
    excerpt: `Standard: Wilderness Reclamation, Growth Spiral, Teferi, Time Raveler, and Cauldron Familiar are banned.
Pioneer: Inverter of Truth, Kethis, the Hidden Hand, Walking Ballista, and Underworld Breach are banned.
Historic: Wilderness Reclamation is suspended. Teferi, Time Raveler is suspended.
Brawl: Teferi, Time Raveler is banned.
Effective Date: August 3, 2020.`,
  },
  {
    id: '2020-09-28',
    title: 'September 28, 2020, Banned and Restricted Announcement',
    url: 'https://magic.wizards.com/en/news/announcements/september-28-2020-banned-and-restricted-announcement-2020-09-28',
    author: 'Ian Duke',
    publishedAt: '2020-09-28',
    clocks: {tabletop: '2020-09-28', mtgo: '2020-09-28', arena: '2020-09-28'},
    excerpt: `Standard: Uro, Titan of Nature's Wrath is banned.
Effective Date: September 28, 2020.`,
  },
  {
    id: '2020-10-12',
    title: 'October 12, 2020, Banned and Restricted Announcement',
    url: 'https://magic.wizards.com/en/news/announcements/october-12-2020-banned-and-restricted-announcement',
    author: 'Ian Duke',
    publishedAt: '2020-10-12',
    clocks: {tabletop: '2020-10-12', mtgo: '2020-10-12', arena: '2020-10-12'},
    excerpt: `Standard: Omnath, Locus of Creation is banned.
Historic: Omnath, Locus of Creation is suspended.
Brawl: Omnath, Locus of Creation is banned.
Effective Date: October 12, 2020.`,
  },
]

const FORMAT_PLATFORMS = {
  legalInStandard: ['tabletop', 'mtgo', 'arena'],
  legalInHistoric: ['arena'],
  legalInBrawl: ['arena'],
  legalInPioneer: ['tabletop', 'mtgo'],
  legalInModern: ['tabletop', 'mtgo'],
  legalInLegacy: ['tabletop', 'mtgo'],
  legalInVintage: ['tabletop', 'mtgo'],
  legalInPauper: ['tabletop', 'mtgo'],
}

/** One row = one card in one format. spans apply on every platform of that format, using that announcement's clock for the platform. */
function row(partial) {
  return partial
}

export const ROWS = [
  row({
    subject: 'golos-tireless-pilgrim',
    name: 'Golos, Tireless Pilgrim',
    aliases: ['golos, tireless pilgrim', 'golos'],
    predicate: 'legalInBrawl',
    announcement: '2020-03-09',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'oko-thief-of-crowns',
    name: 'Oko, Thief of Crowns',
    aliases: ['oko, thief of crowns', 'oko'],
    predicate: 'legalInHistoric',
    announcement: '2020-03-09',
    action: 'banned',
    prior: 'suspended',
  }),
  row({
    subject: 'once-upon-a-time',
    name: 'Once Upon a Time',
    aliases: ['once upon a time'],
    predicate: 'legalInHistoric',
    announcement: '2020-03-09',
    action: 'banned',
    prior: 'suspended',
  }),
  row({
    subject: 'veil-of-summer',
    name: 'Veil of Summer',
    aliases: ['veil of summer'],
    predicate: 'legalInHistoric',
    announcement: '2020-03-09',
    action: 'banned',
    prior: 'suspended',
  }),
  row({
    subject: 'field-of-the-dead',
    name: 'Field of the Dead',
    aliases: ['field of the dead'],
    predicate: 'legalInHistoric',
    announcement: '2020-03-09',
    action: 'unbanned',
    prior: 'suspended',
  }),
  row({
    subject: 'underworld-breach',
    name: 'Underworld Breach',
    aliases: ['underworld breach'],
    predicate: 'legalInLegacy',
    announcement: '2020-03-09',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'once-upon-a-time',
    name: 'Once Upon a Time',
    aliases: ['once upon a time'],
    predicate: 'legalInModern',
    announcement: '2020-03-09',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'drannith-magistrate',
    name: 'Drannith Magistrate',
    aliases: ['drannith magistrate', 'drannith'],
    predicate: 'legalInBrawl',
    announcement: '2020-05-18',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'winota-joiner-of-forces',
    name: 'Winota, Joiner of Forces',
    aliases: ['winota, joiner of forces', 'winota'],
    predicate: 'legalInBrawl',
    announcement: '2020-05-18',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'lurrus-of-the-dream-den',
    name: 'Lurrus of the Dream-Den',
    aliases: ['lurrus of the dream-den', 'lurrus'],
    predicate: 'legalInLegacy',
    announcement: '2020-05-18',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'zirda-the-dawnwaker',
    name: 'Zirda, the Dawnwaker',
    aliases: ['zirda, the dawnwaker', 'zirda'],
    predicate: 'legalInLegacy',
    announcement: '2020-05-18',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'lurrus-of-the-dream-den',
    name: 'Lurrus of the Dream-Den',
    aliases: ['lurrus of the dream-den', 'lurrus'],
    predicate: 'legalInVintage',
    announcement: '2020-05-18',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'agent-of-treachery',
    name: 'Agent of Treachery',
    aliases: ['agent of treachery'],
    predicate: 'legalInHistoric',
    announcement: '2020-07-13',
    action: 'banned',
    prior: 'suspended',
    priorFrom: {arena: '2020-06-04'},
  }),
  row({
    subject: 'fires-of-invention',
    name: 'Fires of Invention',
    aliases: ['fires of invention', 'fires'],
    predicate: 'legalInHistoric',
    announcement: '2020-07-13',
    action: 'banned',
    prior: 'suspended',
    priorFrom: {arena: '2020-06-04'},
    legalUntil: {arena: '2020-06-04'},
  }),
  row({
    subject: 'winota-joiner-of-forces',
    name: 'Winota, Joiner of Forces',
    aliases: ['winota, joiner of forces', 'winota'],
    predicate: 'legalInHistoric',
    announcement: '2020-07-13',
    action: 'banned',
    prior: null,
  }),
  row({
    subject: 'nexus-of-fate',
    name: 'Nexus of Fate',
    aliases: ['nexus of fate', 'nexus'],
    predicate: 'legalInHistoric',
    announcement: '2020-07-13',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'burning-tree-emissary',
    name: 'Burning-Tree Emissary',
    aliases: ['burning-tree emissary', 'burning tree emissary'],
    predicate: 'legalInHistoric',
    announcement: '2020-07-13',
    action: 'suspended',
    prior: 'legal',
  }),
  row({
    subject: 'oath-of-nissa',
    name: 'Oath of Nissa',
    aliases: ['oath of nissa'],
    predicate: 'legalInPioneer',
    announcement: '2020-07-13',
    action: 'unbanned',
    prior: null,
  }),
  row({
    subject: 'arcums-astrolabe',
    name: "Arcum's Astrolabe",
    aliases: ["arcum's astrolabe", 'arcums astrolabe', 'astrolabe'],
    predicate: 'legalInModern',
    announcement: '2020-07-13',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'expedition-map',
    name: 'Expedition Map',
    aliases: ['expedition map'],
    predicate: 'legalInPauper',
    announcement: '2020-07-13',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'mystic-sanctuary',
    name: 'Mystic Sanctuary',
    aliases: ['mystic sanctuary'],
    predicate: 'legalInPauper',
    announcement: '2020-07-13',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'wilderness-reclamation',
    name: 'Wilderness Reclamation',
    aliases: ['wilderness reclamation'],
    predicate: 'legalInStandard',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'growth-spiral',
    name: 'Growth Spiral',
    aliases: ['growth spiral'],
    predicate: 'legalInStandard',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'teferi-time-raveler',
    name: 'Teferi, Time Raveler',
    aliases: ['teferi, time raveler', 'teferi'],
    predicate: 'legalInStandard',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'cauldron-familiar',
    name: 'Cauldron Familiar',
    aliases: ['cauldron familiar', 'cauldron'],
    predicate: 'legalInStandard',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'inverter-of-truth',
    name: 'Inverter of Truth',
    aliases: ['inverter of truth', 'inverter'],
    predicate: 'legalInPioneer',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'kethis-the-hidden-hand',
    name: 'Kethis, the Hidden Hand',
    aliases: ['kethis, the hidden hand', 'kethis'],
    predicate: 'legalInPioneer',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'walking-ballista',
    name: 'Walking Ballista',
    aliases: ['walking ballista', 'ballista'],
    predicate: 'legalInPioneer',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'underworld-breach',
    name: 'Underworld Breach',
    aliases: ['underworld breach'],
    predicate: 'legalInPioneer',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'wilderness-reclamation',
    name: 'Wilderness Reclamation',
    aliases: ['wilderness reclamation'],
    predicate: 'legalInHistoric',
    announcement: '2020-08-03',
    action: 'suspended',
    prior: 'legal',
  }),
  row({
    subject: 'teferi-time-raveler',
    name: 'Teferi, Time Raveler',
    aliases: ['teferi, time raveler', 'teferi'],
    predicate: 'legalInHistoric',
    announcement: '2020-08-03',
    action: 'suspended',
    prior: 'legal',
  }),
  row({
    subject: 'teferi-time-raveler',
    name: 'Teferi, Time Raveler',
    aliases: ['teferi, time raveler', 'teferi'],
    predicate: 'legalInBrawl',
    announcement: '2020-08-03',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'uro-titan-of-natures-wrath',
    name: "Uro, Titan of Nature's Wrath",
    aliases: ["uro, titan of nature's wrath", 'uro'],
    predicate: 'legalInStandard',
    announcement: '2020-09-28',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'omnath-locus-of-creation',
    name: 'Omnath, Locus of Creation',
    aliases: ['omnath, locus of creation', 'omnath'],
    predicate: 'legalInStandard',
    announcement: '2020-10-12',
    action: 'banned',
    prior: 'legal',
  }),
  row({
    subject: 'omnath-locus-of-creation',
    name: 'Omnath, Locus of Creation',
    aliases: ['omnath, locus of creation', 'omnath'],
    predicate: 'legalInHistoric',
    announcement: '2020-10-12',
    action: 'suspended',
    prior: 'legal',
  }),
  row({
    subject: 'omnath-locus-of-creation',
    name: 'Omnath, Locus of Creation',
    aliases: ['omnath, locus of creation', 'omnath'],
    predicate: 'legalInBrawl',
    announcement: '2020-10-12',
    action: 'banned',
    prior: 'legal',
  }),
]

const FORMAT_NAME = {
  legalInStandard: {en: 'Standard', fr: 'Standard', de: 'Standard', es: 'Standard'},
  legalInHistoric: {en: 'Historic', fr: 'Historique', de: 'Historic', es: 'Histórico'},
  legalInBrawl: {en: 'Brawl', fr: 'Brawl', de: 'Brawl', es: 'Brawl'},
  legalInPioneer: {en: 'Pioneer', fr: 'Pioneer', de: 'Pioneer', es: 'Pioneer'},
  legalInModern: {en: 'Modern', fr: 'Modern', de: 'Modern', es: 'Modern'},
  legalInLegacy: {en: 'Legacy', fr: 'Legacy', de: 'Legacy', es: 'Legacy'},
  legalInVintage: {en: 'Vintage', fr: 'Vintage', de: 'Vintage', es: 'Vintage'},
  legalInPauper: {en: 'Pauper', fr: 'Pauper', de: 'Pauper', es: 'Pauper'},
}

export function valueTexts(kind, predicate) {
  const f = FORMAT_NAME[predicate]
  if (kind === 'legal') {
    return {
      en: `Still legal in ${f.en} until the platform clock.`,
      fr: `Encore légal en ${f.fr} jusqu’à l’horloge de la plateforme.`,
      de: `In ${f.de} noch legal bis zur Uhr der Plattform.`,
      es: `Aún legal en ${f.es} hasta el reloj de la plataforma.`,
    }
  }
  if (kind === 'banned') {
    return {
      en: `Banned in ${f.en}.`,
      fr: `Banni en ${f.fr}.`,
      de: `In ${f.de} verboten.`,
      es: `Prohibido en ${f.es}.`,
    }
  }
  if (kind === 'suspended') {
    return {
      en: `Suspended in ${f.en}.`,
      fr: `Suspendu en ${f.fr}.`,
      de: `In ${f.de} suspendiert.`,
      es: `Suspendido en ${f.es}.`,
    }
  }
  return {
    en: `Unbanned in ${f.en}. Legal again.`,
    fr: `Débanni en ${f.fr}. De nouveau légal.`,
    de: `In ${f.de} entbannt. Wieder legal.`,
    es: `Desbaneado en ${f.es}. Legal de nuevo.`,
  }
}

export function announcementById(id) {
  return ANNOUNCEMENTS.find((a) => a.id === id)
}

export function expandClaims() {
  const claims = []
  for (const row of ROWS) {
    const ann = announcementById(row.announcement)
    const platforms = FORMAT_PLATFORMS[row.predicate]
    for (const platform of platforms) {
      const switchOn = ann.clocks[platform]
      const spans = []
      if (row.legalUntil?.[platform]) {
        spans.push({kind: 'legal', until: row.legalUntil[platform], from: null})
      }
      if (row.prior) {
        spans.push({
          kind: row.prior,
          from: row.priorFrom?.[platform] || null,
          until: switchOn,
        })
      }
      spans.push({kind: row.action === 'unbanned' ? 'unbanned' : row.action, from: switchOn, until: null})
      spans.forEach((span, i) => {
        const texts = valueTexts(span.kind, row.predicate)
        const last = i === spans.length - 1
        claims.push({
          _id: `claim-${row.subject}-${row.predicate.replace('legalIn', '').toLowerCase()}-${platform}-${span.kind}-${span.from || 'start'}`,
          _type: 'rulesClaim',
          game: 'Magic: The Gathering',
          subject: row.subject,
          predicate: row.predicate,
          platform,
          status: last ? 'current' : 'superseded',
          value: texts.en,
          valueFr: texts.fr,
          valueDe: texts.de,
          valueEs: texts.es,
          quote: `${row.name}: ${span.kind}. ${ann.title}. ${platform} clock ${switchOn}.`,
          effectiveFrom: span.from,
          effectiveUntil: span.until,
          sourceTitle: ann.title,
          sourceUrl: ann.url,
          clockDoc: `rules-change-${ann.id}`,
        })
      })
    }
  }
  return claims
}

export function cardAliases() {
  const pairs = []
  for (const row of ROWS) {
    for (const alias of row.aliases) pairs.push([alias, row.subject])
  }
  pairs.sort((a, b) => b[0].length - a[0].length)
  const seen = new Set()
  return pairs.filter(([alias, subject]) => {
    const key = alias + '|' + subject
    if (seen.has(alias)) return false
    seen.add(alias)
    return true
  })
}

export const WORKED = [
  {
    _id: 'call-oko-arena-march11',
    _type: 'workedCall',
    title: 'Oko on Arena, March 11',
    question: 'On Arena, March 11 2020, is Oko banned in Historic?',
    date: '2020-03-11',
    finding: 'Not yet banned. Arena’s clock is March 12. The March 9 announcement moves Oko from suspended to banned.',
  },
  {
    _id: 'call-golos-arena-march11',
    _type: 'workedCall',
    title: 'Golos on Arena, March 11',
    question: 'On Arena, March 11 2020, is Golos banned in Brawl?',
    date: '2020-03-11',
    finding: 'No. Brawl’s Arena clock is March 12. March 11 is still the day before.',
  },
  {
    _id: 'call-winota-brawl-may19',
    _type: 'workedCall',
    title: 'Winota in Brawl, May 19',
    question: 'On Arena, May 19 2020, is Winota banned in Brawl?',
    date: '2020-05-19',
    finding: 'No. Tabletop’s May 18 date is not the Brawl clock. Arena bans Winota on May 21.',
  },
  {
    _id: 'call-lurrus-legacy-may18',
    _type: 'workedCall',
    title: 'Lurrus in Legacy, May 18',
    question: 'On paper, May 18 2020, is Lurrus banned in Legacy?',
    date: '2020-05-18',
    finding: 'Yes. Legacy’s tabletop and Magic Online clock is May 18. That date is not an Arena clock.',
  },
  {
    _id: 'call-nexus-july15',
    _type: 'workedCall',
    title: 'Nexus on Arena, July 15',
    question: 'On Arena, July 15 2020, is Nexus of Fate banned in Historic?',
    date: '2020-07-15',
    finding: 'No. Arena’s July 13 announcement clock is July 16.',
  },
  {
    _id: 'call-growth-spiral-aug2',
    _type: 'workedCall',
    title: 'Growth Spiral on paper, August 2',
    question: 'On paper, August 2 2020, is Growth Spiral banned in Standard?',
    date: '2020-08-02',
    finding: 'No. The August 3 announcement is effective August 3 on every platform it names.',
  },
  {
    _id: 'call-omnath-historic-oct12',
    _type: 'workedCall',
    title: 'Omnath Historic, October 12',
    question: 'On Arena, October 12 2020, is Omnath suspended in Historic?',
    date: '2020-10-12',
    finding: 'Suspended in Historic. Banned in Standard and Brawl the same day. Three answers, one card.',
  },
]
