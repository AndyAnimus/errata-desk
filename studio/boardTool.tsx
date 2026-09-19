import {definePlugin} from 'sanity'
import {ClockBoard} from './ClockBoard'

export const boardTool = definePlugin({
  name: 'errata-board',
  tools: [
    {
      name: 'board',
      title: 'Clock board',
      component: ClockBoard,
    },
  ],
})
