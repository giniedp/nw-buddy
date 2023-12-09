import { NumberFilter } from '@ag-grid-community/core'
import { SelectFilter } from '~/ui/data/ag-grid'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'
import { ArmorWeightSet } from './armor-weights.store'

export type ArmorWeightTableUtils = TableGridUtils<ArmorWeightTableRecord>
export type ArmorWeightTableRecord = ArmorWeightSet

export function armorWeightColIcon(util: ArmorWeightTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    pinned: true,
    width: 62,
    cellClass: ['overflow-visible'],
    //   cellRenderer: util.cellRenderer(({ data }) => {
    //     return util.elA(
    //       {
    //         attrs: {
    //           href: util.tipLink('ability', data.AbilityID),
    //           target: '_blank',
    //         },
    //       },
    //       util.elImg({
    //         src: data.Icon || NW_FALLBACK_ICON,
    //         class: [
    //           'aspect-square',
    //           'transition-all',
    //           'translate-x-0',
    //           'hover:translate-x-1',
    //           'nw-icon',
    //           `bg-ability-${getAbilityCategoryTag(data)}`,
    //           data?.IsActiveAbility ? 'rounded-sm' : 'rounded-full',
    //           data?.WeaponTag ? 'border' : null,
    //         ],
    //       })
    //     )
    //   }),
  })
}

export function armorWeightColHead(util: ArmorWeightTableUtils) {
  return util.colDef<string>({
    colId: 'head',
    headerValueGetter: () => 'Head',
    valueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'head')?.label,
    tooltipValueGetter: util.tipValueGetter(({ data }) => data.items.find((it) => it?.slot?.id === 'head')?.weight),
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
    cellClassRules: {
      'text-success': ({ value }) => value === 'Light',
      'text-primary': ({ value }) => value === 'Medium',
      'text-error': ({ value }) => value === 'Heavy',
    },
  })
}

export function armorWeightColChest(util: ArmorWeightTableUtils) {
  return util.colDef<string>({
    colId: 'chest',
    headerValueGetter: () => 'Chest',
    valueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'chest')?.label,
    tooltipValueGetter: util.tipValueGetter(({ data }) => data.items.find((it) => it?.slot?.id === 'chest')?.weight),
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
    cellClassRules: {
      'text-secondary': ({ value }) => value === 'Weightless',
      'text-success': ({ value }) => value === 'Light',
      'text-primary': ({ value }) => value === 'Medium',
      'text-error': ({ value }) => value === 'Heavy',
    },
  })
}
export function armorWeightColHands(util: ArmorWeightTableUtils) {
  return util.colDef<string>({
    colId: 'hands',
    headerValueGetter: () => 'Hands',
    valueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'hands')?.label,
    tooltipValueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'hands')?.weight,
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
    cellClassRules: {
      'text-success': ({ value }) => value === 'Light',
      'text-primary': ({ value }) => value === 'Medium',
      'text-error': ({ value }) => value === 'Heavy',
    },
  })
}
export function armorWeightColLegs(util: ArmorWeightTableUtils) {
  return util.colDef<string>({
    colId: 'legs',
    headerValueGetter: () => 'Legs',
    valueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'legs')?.label,
    tooltipValueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'legs')?.weight,
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
    cellClassRules: {
      'text-success': ({ value }) => value === 'Light',
      'text-primary': ({ value }) => value === 'Medium',
      'text-error': ({ value }) => value === 'Heavy',
    },
  })
}
export function armorWeightColFeet(util: ArmorWeightTableUtils) {
  return util.colDef<string>({
    colId: 'feet',
    headerValueGetter: () => 'Feet',
    valueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'feet')?.label,
    tooltipValueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'feet')?.weight,
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
    cellClassRules: {
      'text-success': ({ value }) => value === 'Light',
      'text-primary': ({ value }) => value === 'Medium',
      'text-error': ({ value }) => value === 'Heavy',
    },
  })
}
export function armorWeightColShield(util: ArmorWeightTableUtils) {
  return util.colDef<string>({
    colId: 'shield',
    headerValueGetter: () => 'Shield',
    valueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'weapon3')?.label,
    valueFormatter: ({ value }) => humanize(value),
    tooltipValueGetter: ({ data }) => data.items.find((it) => it?.slot?.id === 'weapon3')?.weight,
    getQuickFilterText: ({ value }) => value,
    filter: SelectFilter,
    cellClassRules: {
      'text-success': ({ value }) => value === 'RoundShield',
      'text-primary': ({ value }) => value === 'KiteShield',
      'text-error': ({ value }) => value === 'TowerShield',
    },
  })
}

export function armorWeightColRating(util: ArmorWeightTableUtils) {
  return util.colDef<string>({
    colId: 'rating',
    headerValueGetter: () => 'Rating',
    valueGetter: ({ data }) => data.rating.toFixed(1),
  })
}

export function armorWeightColWeight(util: ArmorWeightTableUtils) {
  return util.colDef<number>({
    colId: 'weight',
    headerValueGetter: () => 'Weight',
    valueGetter: ({ data }) => data.weight,
    filter: NumberFilter,
    cellClassRules: {
      'text-success': ({ data }) => data.weightClass === 'light',
      'text-primary': ({ data }) => data.weightClass === 'medium',
      'text-error': ({ data }) => data.weightClass === 'heavy',
    },
  })
}
