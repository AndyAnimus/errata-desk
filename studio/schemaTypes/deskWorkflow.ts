import {defineArrayMember, defineField, defineType} from 'sanity'

export const deskWorkflow = defineType({
  name: 'deskWorkflow',
  title: 'Desk workflow',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'steps',
      title: 'Legal transitions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'from', type: 'string', validation: (r) => r.required()}),
            defineField({name: 'to', type: 'string', validation: (r) => r.required()}),
            defineField({
              name: 'actor',
              type: 'string',
              options: {list: ['agent', 'person']},
              validation: (r) => r.required(),
            }),
          ],
          preview: {select: {title: 'from', subtitle: 'actor'}},
        }),
      ],
    }),
  ],
})
