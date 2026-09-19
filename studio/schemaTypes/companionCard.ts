import {defineField, defineType} from 'sanity'

export const companionCard = defineType({
  name: 'companionCard',
  title: 'Companion card',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'manaCost', title: 'Mana cost', type: 'string'}),
    defineField({name: 'typeLine', title: 'Type line', type: 'string'}),
    defineField({name: 'oracleText', title: 'Oracle text', type: 'text'}),
    defineField({name: 'imageUrl', title: 'Image', type: 'url'}),
    defineField({name: 'scryfallUrl', title: 'Scryfall', type: 'url'}),
    defineField({name: 'setName', title: 'Set', type: 'string'}),
  ],
  preview: {select: {title: 'name', subtitle: 'typeLine', media: 'imageUrl'}},
})
