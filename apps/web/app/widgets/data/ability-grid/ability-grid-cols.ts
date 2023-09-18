import {
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE_BASE,
  getAbilityCategoryTag,
  getWeaponTagLabel,
} from '@nw-data/common'
import { Ability, Statuseffect } from '@nw-data/generated'
import { map, switchMap } from 'rxjs'
import { sanitizeHtml } from '~/nw'
import { NwWeaponType } from '~/nw/weapon-types'
import { SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'
import { humanize } from '~/utils'

export type AbilityGridUtils = DataGridUtils<AbilityGridRecord>
export type AbilityGridRecord = Ability & {
  $weaponType: NwWeaponType
  $selfApplyStatusEffect: Statuseffect[]
  $otherApplyStatusEffect: Statuseffect
}

export function abilityColIcon(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: false,
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: {
            href: util.nwLink.link('ability', data.AbilityID),
            target: '_blank',
          },
        },
        util.elImg({
          src: data.Icon || NW_FALLBACK_ICON,
          class: [
            'aspect-square',
            'transition-all',
            'translate-x-0',
            'hover:translate-x-1',
            'nw-icon',
            `bg-ability-${getAbilityCategoryTag(data)}`,
            data?.IsActiveAbility ? 'rounded-sm' : 'rounded-full',
            data?.WeaponTag ? 'border' : null,
          ],
        })
      )
    }),
  })
}

export function abilityColName(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 250,
    valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.DisplayName)),
    getQuickFilterText: ({ value }) => value,
  })
}

export function abilityColID(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'abilityId',
    headerValueGetter: () => 'Ability ID',
    field: util.fieldName('AbilityID'),
    hide: true,
  })
}
export function abilityColDescription(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'description',
    headerValueGetter: () => 'Description',
    field: util.fieldName('Description'),
    width: 400,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'text-primary', 'italic'],
    filterValueGetter: ({ data }) => util.i18n.get(data.Description),
    cellRenderer: util.cellRendererAsync(),
    cellRendererParams: util.cellRendererAsyncParams<string>({
      update: (el, text) => {
        el.innerHTML = sanitizeHtml(text)
      },
      source: ({ data, value }) => {
        return util.i18n
          .observe(data.Description)
          .pipe(
            switchMap((v) => {
              return util.expr.solve({
                text: v,
                charLevel: NW_MAX_CHARACTER_LEVEL,
                itemId: data.AbilityID,
                gearScore: NW_MAX_GEAR_SCORE_BASE,
              })
            })
          )
          .pipe(map((it) => util.lineBreaksToHtml(it)))
      },
    }),
  })
}

export function abilityColUiCategory(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'uiCategory',
    headerValueGetter: () => 'UI Category',
    valueGetter: util.valueGetter(({ data }) => data.UICategory),
    filter: SelectFilter,
  })
}

export function abilityColWeaponTag(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'weaponTag',
    headerValueGetter: () => 'Weapon Tag',
    valueGetter: util.valueGetter(({ data }) => data.WeaponTag),
    valueFormatter: ({ value }) => util.i18n.get(getWeaponTagLabel(value)),
    filter: SelectFilter,
  })
}

export function abilityColSource(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'source',
    headerValueGetter: () => 'Source',
    valueGetter: util.valueGetter(({ data }) => data['$source']),
    hide: true,
    filter: SelectFilter,
  })
}

export function abilityColAttackType(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'attackType',
    headerValueGetter: () => 'Attack Type',
    valueGetter: util.valueGetter(({ data }) => data.AttackType),
    filter: SelectFilter,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}

export function abilityColDamageTable(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'damageTableRow',
    headerValueGetter: () => 'Damage Table Row',
    valueGetter: util.valueGetter(({ data }) => data.DamageTableRow),
    filter: SelectFilter,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}

export function abilityColDamageTableOverride(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'damageTableRowOverride',
    headerValueGetter: () => 'Damage Table Row Override',
    valueGetter: util.valueGetter(({ data }) => data.DamageTableRowOverride),
    filter: SelectFilter,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}

export function abilityColRemoteDamageTable(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'remoteDamageTableRow',
    headerValueGetter: () => 'Remote Damage TableRow',
    valueGetter: util.valueGetter(({ data }) => data.RemoteDamageTableRow),
    filter: SelectFilter,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}

export function abilityColAfterAction(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'afterAction',
    headerValueGetter: () => 'After Action',
    valueGetter: util.valueGetter(({ data }) => data.AfterAction),
    filter: SelectFilter,
  })
}

export function abilityColOnAction(util: AbilityGridUtils) {
  return util.colDef({
    colId: 'onAction',
    headerValueGetter: () => 'On Action',
    valueGetter: util.valueGetter(({ data }) => {
      const result = Object.keys(data)
        .filter((it) => it.startsWith('On') && !!data[it])
        .map((it) => humanize(it).split(' '))
        .map((it) => (it[0] === 'On' ? it.slice(1).join('') : null))
        .filter((it) => !!it)
      return result.length ? result : null
    }),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filter: SelectFilter,
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
