import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {boardTool} from './boardTool'

export default defineConfig({
  name: 'default',
  title: 'Errata Desk',

  projectId: 'gsu7qzk9',
  dataset: 'production',

  plugins: [boardTool(), structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
