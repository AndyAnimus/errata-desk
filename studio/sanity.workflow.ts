import {defineWorkflowConfig} from '@sanity/workflow-engine/define'
import {signCall} from './workflows/sign-call'

export default defineWorkflowConfig({
  deployments: [
    {
      expectedMinReaderModel: 4,
      name: 'production',
      tag: 'production',
      workflowResource: {type: 'dataset', id: 'gsu7qzk9.production'},
      definitions: [signCall],
    },
  ],
})
