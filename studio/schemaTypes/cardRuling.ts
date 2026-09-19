import {defineField, defineType} from 'sanity'

export const cardRuling = defineType({
  name: 'cardRuling',
  title: 'Card ruling',
  type: 'document',
  fields: [
    defineField({name: 'cardName', title: 'Card', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'publishedAt', title: 'Published', type: 'date', validation: (r) => r.required()}),
    defineField({name: 'comment', type: 'text', validation: (r) => r.required()}),
    defineField({name: 'source', type: 'string'}),
    defineField({name: 'scryfallId', title: 'Scryfall id', type: 'string'}),
  ],
  preview: {
    select: {title: 'cardName', subtitle: 'publishedAt'},
  },
})
