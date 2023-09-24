import { getAbilityCategoryTag } from '@nw-data/common'
import { SkillBuildRow } from '~/data'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type SkillsetTableUtils = TableGridUtils<SkillsetTableRecord>
export type SkillsetTableRecord = SkillBuildRow

export function skillsetColName(util: SkillsetTableUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    // pinned: !util.layout.isHandset,
    sortable: true,
    filter: true,
    width: 250,
    valueGetter: util.valueGetter(({ data }) => data.record.name),
    getQuickFilterText: ({ value }) => value,
  })
}
export function skillsetColWeapon(util: SkillsetTableUtils) {
  return util.colDef({
    colId: 'weapon',
    headerValueGetter: () => 'Weapon',
    pinned: false,
    sortable: true,
    filter: true,
    width: 100,
    valueGetter: util.valueGetter(({ data }) => humanize(data.record.weapon)),
    getQuickFilterText: ({ value }) => value,
  })
}
export function skillsetColSkills(util: SkillsetTableUtils) {
  return util.colDef({
    colId: 'skills',
    headerValueGetter: () => 'Skills',
    pinned: false,
    sortable: true,
    filter: true,
    width: 250,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.el(
        'div.flex.flex-row.gap-1',
        {},
        data.abilities?.map((it) => {
          return util.elA(
            {
              class: ['border', 'border-1', 'transition-all', 'translate-x-0', 'hover:translate-x-1'],
              attrs: {
                href: util.tipLink('ability', it.AbilityID),
                target: '_blank',
              },
            },
            [
              util.elImg({
                class: ['nw-icon', `bg-ability-${getAbilityCategoryTag(it)}`],
                src: it.Icon,
              }),
            ]
          )
        })
      )
    }),
    //valueGetter: util.valueGetter(({ data }) => data.record.),
  })
}
