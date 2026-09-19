import {defineField, defineType} from 'sanity'

export const workedCall = defineType({
  name: 'workedCall',
  title: 'Desk call',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'question', type: 'text', validation: (r) => r.required()}),
    defineField({name: 'date', type: 'date'}),
    defineField({name: 'finding', title: 'What the desk holds', type: 'text', validation: (r) => r.required()}),
    defineField({name: 'sourceUrl', type: 'url'}),
  ],
  preview: {select: {title: 'title', subtitle: 'date'}},
})
