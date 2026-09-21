/**
 * Drive the deployed Sanity Workflow `sign-call` with the editor token.
 * The sign action requires administrator, so this token must be refused.
 */
import {readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'
import {createEngine, refDataset} from '@sanity/workflow-engine'

const token = readFileSync(new URL('../../secrets/sanity.env', import.meta.url), 'utf8')
  .split('\n')
  .find((l) => l.startsWith('SANITY_API_TOKEN='))
  .slice('SANITY_API_TOKEN='.length)

const client = createClient({
  projectId: 'gsu7qzk9',
  dataset: 'production',
  apiVersion: '2026-04-29',
  token,
  useCdn: false,
})

const engine = createEngine({
  client,
  tag: 'production',
  workflowResource: {type: 'dataset', id: 'gsu7qzk9.production'},
})

const subjectId = 'case-workflow-sign'

await client.createOrReplace({
  _id: subjectId,
  _type: 'deskCase',
  title: 'Workflow engine run',
  platform: 'arena',
  date: '2020-06-02',
  state: 'awaitingSignature',
  value: 'Cast the companion once from outside the game. No extra generic cost.',
})

const started = await engine.startInstance({
  definition: 'sign-call',
  initialFields: [
    {
      type: 'subject',
      name: 'subject',
      value: refDataset({
        projectId: 'gsu7qzk9',
        dataset: 'production',
        documentId: subjectId,
        type: 'deskCase',
      }),
    },
  ],
})
const instanceId = started.instance._id
console.log('started', instanceId, started.instance.stage)

async function fire(activity, action) {
  const result = await engine.fireAction({instanceId, activity, action})
  console.log('fired', action, 'stage', result.instance.stage, 'changed', result.changed)
  return result
}

await fire('derive', 'derive')
await fire('hold', 'hold')

let signRefused = ''
try {
  await fire('sign', 'sign')
  signRefused = 'NOT REFUSED'
} catch (e) {
  signRefused = String(e.message || e).slice(0, 240)
  console.log('sign refused:', signRefused)
}

const after = await client.getDocument(instanceId)
console.log('stage', after?.currentStage)
if (!signRefused || signRefused === 'NOT REFUSED') {
  console.error('editor token was allowed to sign')
  process.exit(1)
}
if (after?.currentStage === 'signed') {
  console.error('instance reached signed')
  process.exit(1)
}
console.log('workflow run ok', instanceId, after?.currentStage)
