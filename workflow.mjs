export const STEPS = [
  {from: 'asked', to: 'derived', actor: 'agent'},
  {from: 'derived', to: 'awaitingSignature', actor: 'agent'},
  {from: 'awaitingSignature', to: 'signed', actor: 'person'},
]

export function assertTransition(from, to, actor) {
  const step = STEPS.find((s) => s.from === from && s.to === to && s.actor === actor)
  if (!step) {
    const err = new Error(`illegal: ${actor} cannot move ${from} → ${to}`)
    err.code = 'illegal'
    throw err
  }
  if (to === 'signed' && actor !== 'person') {
    const err = new Error('decidedBy stays empty until a person signs')
    err.code = 'unsigned'
    throw err
  }
}
