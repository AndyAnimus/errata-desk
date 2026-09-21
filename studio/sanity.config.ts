import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {boardTool} from './boardTool'
import {workflowStudioPlugin} from '@sanity/workflow-studio-plugin'

export default defineConfig({
  name: 'default',
  title: 'Errata Desk',

  projectId: 'gsu7qzk9',
  dataset: 'production',

  plugins: [boardTool(), structureTool(), visionTool(), workflowStudioPlugin({tag: 'production'})],

  schema: {
    types: schemaTypes,
  },
})
