import { describe, expect, it } from 'vitest'
import type { SheetFamily } from '../../api/browse'
import { familyTooltip, urlSelection } from './DataTool.store'
import { legacyHref } from './DataTool'
import { filterFamilies } from './list/FamilyList.store'

const family = (name: string, ...sheets: string[]) =>
  ({ name, sheets: sheets.map((it) => ({ name: it })) }) as unknown as SheetFamily

describe('urlSelection', () => {
  it('selects by the key, the index only without a key', () => {
    expect(urlSelection('Sword', '4')).toEqual({ key: 'Sword', row: undefined })
    expect(urlSelection(undefined, '4')).toEqual({ key: undefined, row: 4 })
    expect(urlSelection('', undefined)).toEqual({ key: undefined, row: undefined })
  })
})

describe('legacyHref', () => {
  it('moves the family of an old link into the path', () => {
    expect(legacyHref(undefined, { family: 'ItemData', key: 'Sword' })).toBe('/data/ItemData?key=Sword')
    expect(legacyHref(undefined, { family: 'ItemData', row: '3' })).toBe('/data/ItemData?row=3')
    expect(legacyHref(undefined, { family: 'ItemData' })).toBe('/data/ItemData')
  })

  it('leaves current links alone', () => {
    expect(legacyHref('ItemData', { family: 'Other' })).toBeNull()
    expect(legacyHref(undefined, {})).toBeNull()
  })
})

describe('familyTooltip', () => {
  it('lists the sheets under the name', () => {
    expect(familyTooltip(family('LootBuckets', 'LootBucketsFish', 'LootBucketsPvP'), 'x')).toBe(
      'LootBuckets\nLootBucketsFish\nLootBucketsPvP',
    )
    expect(familyTooltip(undefined, 'Unknown')).toBe('Unknown')
  })
})

describe('filterFamilies', () => {
  const families = [family('AbilityData', 'FlailAbilityTable'), family('ItemData', 'Swords', 'Bows')]

  it('matches row type names and sheet names, with the matching sheets', () => {
    expect(filterFamilies(families, 'item').map((it) => [it.family.name, it.sheets])).toEqual([['ItemData', []]])
    expect(filterFamilies(families, ' BOW ').map((it) => [it.family.name, it.sheets])).toEqual([['ItemData', ['Bows']]])
    expect(filterFamilies(families, 'flail').map((it) => it.family.name)).toEqual(['AbilityData'])
  })

  it('lists all row types without a filter', () => {
    expect(filterFamilies(families, '').length).toBe(2)
  })
})
