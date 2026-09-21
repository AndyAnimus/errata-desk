import {defineCliConfig} from 'sanity/cli'
import {fileURLToPath} from 'node:url'

const uiCompat = fileURLToPath(new URL('./ui-compat.ts', import.meta.url))

export default defineCliConfig({
  api: {
    projectId: 'gsu7qzk9',
    dataset: 'production'
  },
  vite: (config) => {
    const prev = config.resolve?.alias
    const mapped = Array.isArray(prev)
      ? prev
      : Object.entries(prev || {}).map(([find, replacement]) => ({find, replacement}))
    return {
      ...config,
      resolve: {
        ...config.resolve,
        alias: [...mapped, {find: /^@sanity\/ui$/, replacement: uiCompat}],
      },
    }
  },
  deployment: {
    appId: 'oirifdpoq2jaw4a62teca7tc',
    autoUpdates: false,
  },
})
