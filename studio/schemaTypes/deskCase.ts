import {defineArrayMember, defineField, defineType} from 'sanity'

export const deskCase = defineType({
  name: 'deskCase',
  title: 'Desk case',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'platform',
      type: 'string',
      options: {list: ['tabletop', 'arena', 'mtgo']},
      validation: (r) => r.required(),
    }),
    defineField({name: 'date', type: 'date', validation: (r) => r.required()}),
    defineField({name: 'claimId', type: 'string'}),
    defineField({name: 'value', title: 'Derived answer', type: 'text'}),
    defineField({name: 'reading', type: 'text'}),
    defineField({
      name: 'state',
      type: 'string',
      options: {list: ['asked', 'derived', 'awaitingSignature', 'signed']},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'decidedBy',
      title: 'Decided by',
      type: 'string',
      description: 'Stays empty until a person signs. The agent cannot fill this.',
    }),
    defineField({
      name: 'decidedAt',
      title: 'Decided at',
      type: 'datetime',
      description: 'Stays empty until a person signs.',
    }),
    defineField({
      name: 'transitions',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'at', type: 'datetime'}),
            defineField({name: 'from', type: 'string'}),
            defineField({name: 'to', type: 'string'}),
            defineField({name: 'actor', type: 'string'}),
            defineField({name: 'ms', title: 'Elapsed ms', type: 'number'}),
          ],
        }),
      ],
    }),
  ],
})
