import {defineWorkflow} from '@sanity/workflow-engine/define'

/**
 * The sign call, as a Sanity Workflows definition.
 * An editor (the agent token) may derive and hold.
 * Only an administrator may fire the sign action.
 */
export const signCall = defineWorkflow({
  name: 'sign-call',
  title: 'Sign the call',
  description: 'Agent derives the claim. A person signs it. The agent token cannot.',
  initialStage: 'asked',
  fields: [
    {
      type: 'subject',
      name: 'subject',
      title: 'Desk case',
      initialValue: {type: 'input'},
    },
  ],
  stages: [
    {
      name: 'asked',
      title: 'Asked',
      activities: [
        {
          name: 'derive',
          title: 'Derive the claim',
          actions: [
            {
              name: 'derive',
              title: 'Derive',
              status: 'done',
              roles: ['editor'],
            },
          ],
        },
      ],
      transitions: [{name: 'to-derived', title: 'Hold for signature', to: 'derived'}],
    },
    {
      name: 'derived',
      title: 'Derived',
      activities: [
        {
          name: 'hold',
          title: 'Hold for a person',
          actions: [
            {
              name: 'hold',
              title: 'Request signature',
              status: 'done',
              roles: ['editor'],
            },
          ],
        },
      ],
      transitions: [{name: 'to-sign', title: 'Await signature', to: 'awaitingSignature'}],
    },
    {
      name: 'awaitingSignature',
      title: 'Awaiting signature',
      activities: [
        {
          name: 'sign',
          title: 'Sign the call',
          actions: [
            {
              name: 'sign',
              title: 'Sign',
              status: 'done',
              roles: ['administrator'],
            },
          ],
        },
      ],
      transitions: [{name: 'to-signed', title: 'Close', to: 'signed'}],
    },
    {name: 'signed', title: 'Signed', activities: []},
  ],
})
