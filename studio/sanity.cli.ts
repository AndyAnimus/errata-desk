import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'gsu7qzk9',
    dataset: 'production'
  },
  deployment: {
    appId: 'oirifdpoq2jaw4a62teca7tc',
    autoUpdates: false,
  },
})
