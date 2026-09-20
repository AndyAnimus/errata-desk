import {defineField, defineType} from 'sanity'

export const rulesClaim = defineType({
  name: 'rulesClaim',
  title: 'Rules claim',
  type: 'document',
  fields: [
    defineField({name: 'game', title: 'Game', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'subject', title: 'Subject', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'predicate',
      title: 'Predicate',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {list: ['tabletop', 'arena', 'mtgo']},
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: ['current', 'superseded']},
      validation: (r) => r.required(),
    }),
    defineField({name: 'value', title: 'Value', type: 'text', validation: (r) => r.required()}),
    defineField({name: 'valueFr', title: 'Value (FR)', type: 'text'}),
    defineField({name: 'valueDe', title: 'Value (DE)', type: 'text'}),
    defineField({name: 'valueEs', title: 'Value (ES)', type: 'text'}),
    defineField({name: 'quote', title: 'Source quote', type: 'text'}),
    defineField({name: 'effectiveFrom', title: 'Effective from', type: 'date'}),
    defineField({name: 'effectiveUntil', title: 'Effective until', type: 'date'}),
    defineField({name: 'sourceTitle', title: 'Source title', type: 'string'}),
    defineField({name: 'sourceUrl', title: 'Source URL', type: 'url'}),
  ],
  preview: {
    select: {title: 'platform', subtitle: 'status', date: 'effectiveFrom'},
    prepare({title, subtitle, date}) {
      return {title: `${title} · ${subtitle}`, subtitle: date}
    },
  },
})
