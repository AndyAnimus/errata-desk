import {defineArrayMember, defineField, defineType} from 'sanity'

export const rulesChange = defineType({
  name: 'rulesChange',
  title: 'Rules change',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'subject', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'sourceUrl', type: 'url'}),
    defineField({
      name: 'clocks',
      title: 'Platform clocks',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              type: 'string',
              options: {list: ['tabletop', 'arena', 'mtgo']},
              validation: (r) => r.required(),
            }),
            defineField({name: 'switchesOn', title: 'Switches on', type: 'date', validation: (r) => r.required()}),
          ],
          preview: {select: {title: 'platform', subtitle: 'switchesOn'}},
        }),
      ],
    }),
  ],
})
