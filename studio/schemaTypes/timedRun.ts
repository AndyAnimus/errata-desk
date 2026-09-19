import {defineArrayMember, defineField, defineType} from 'sanity'

export const timedRun = defineType({
  name: 'timedRun',
  title: 'Timed edit run',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'ranAt', type: 'datetime'}),
    defineField({name: 'passed', type: 'number'}),
    defineField({name: 'failed', type: 'number'}),
    defineField({
      name: 'steps',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', type: 'string'}),
            defineField({name: 'ms', type: 'number'}),
            defineField({name: 'ok', type: 'boolean'}),
            defineField({name: 'note', type: 'string'}),
          ],
        }),
      ],
    }),
  ],
})
