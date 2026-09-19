import {defineField, defineType} from 'sanity'

export const ruling = defineType({
  name: 'ruling',
  title: 'Standing ruling',
  type: 'document',
  fields: [
    defineField({
      name: 'platform',
      type: 'string',
      options: {list: ['tabletop', 'arena', 'mtgo']},
      validation: (r) => r.required(),
    }),
    defineField({name: 'date', title: 'Date', type: 'date', validation: (r) => r.required()}),
    defineField({name: 'claimId', title: 'Bound claim', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'reading', title: 'What was asked', type: 'text'}),
    defineField({name: 'value', title: 'Standing answer', type: 'text'}),
    defineField({name: 'sourceUrl', type: 'url'}),
  ],
})
