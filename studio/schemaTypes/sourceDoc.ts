import {defineField, defineType} from 'sanity'

export const sourceDoc = defineType({
  name: 'sourceDoc',
  title: 'Primary source',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'sourceUrl', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'publishedAt', type: 'date'}),
    defineField({name: 'author', type: 'string'}),
    defineField({name: 'language', type: 'string', options: {list: ['en', 'fr', 'de', 'es']}}),
    defineField({name: 'excerpt', type: 'text', validation: (r) => r.required()}),
    defineField({
      name: 'about',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Topics this excerpt covers',
    }),
  ],
})
