import {
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE_BASE,
  getAbilityCategoryTag,
  getWeaponTagLabel,
} from '@nw-data/common'
import { AbilityData, COLS_ABILITYDATA, StatusEffectData } from '@nw-data/generated'
import { map, switchMap } from 'rxjs'
import { NwWeaponType } from '~/nw/weapon-types'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type AbilityTableUtils = TableGridUtils<AbilityTableRecord>
export type AbilityTableRecord = AbilityData & {
  $weaponType: NwWeaponType
  $selfApplyStatusEffect: StatusEffectData[]
  $otherApplyStatusEffect: StatusEffectData[]
}

export function abilityColIcon(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    getQuickFilterText: () => '',
    resizable: false,
    sortable: false,
    pinned: true,
    filter: ExpressionFilter,
    filterParams: ExpressionFilter.params({
      fields: Object.keys(COLS_ABILITYDATA),
    }),
    width: 62,
    field: 'Icon',
    cellClass: ['overflow-visible'],
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: {
            href: util.tipLink('ability', data.AbilityID),
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
        }),
      )
    }),
  })
}

export function abilityColName(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    width: 250,
    valueGetter: ({ data }) => {
      if (data.DisplayName) {
        return util.i18n.get(data.DisplayName)
      }
      return data.AbilityID
    },
    cellClass: ({ data, value }) => {
      if (data.DisplayName && data.DisplayName !== value) {
        return null
      }
      return ['font-mono', 'text-neutral-content/50']
    },
  })
}

export function abilityColID(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'abilityId',
    headerValueGetter: () => 'Ability ID',
    field: 'AbilityID',
    hide: true,
  })
}
export function abilityColDescription(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'description',
    headerValueGetter: () => 'Description',
    field: 'Description',
    width: 400,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'text-nw-description', 'italic'],
    filterValueGetter: ({ data }) => util.i18n.get(data.Description),
    cellRenderer: util.cellRendererAsync(),
    cellRendererParams: util.cellRendererAsyncParams<string>({
      update: (el, text) => {
        el.innerHTML = util.nwHtml.sanitize(text)
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
            }),
          )
          .pipe(map((it) => util.lineBreaksToHtml(it)))
      },
    }),
  })
}

export function abilityColUiCategory(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'uiCategory',
    headerValueGetter: () => 'UI Category',
    field: 'UICategory',
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function abilityColWeaponTag(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'weaponTag',
    headerValueGetter: () => 'Weapon Tag',
    field: 'WeaponTag',
    valueFormatter: ({ value }) => util.i18n.get(getWeaponTagLabel(value)),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function abilityColSource(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'source',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Source',
    valueGetter: ({ data }) => data['$source'],
    hide: true,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function abilityColAttackType(util: AbilityTableUtils) {
  return util.colDef<string[]>({
    colId: 'attackType',
    headerValueGetter: () => 'Attack Type',
    valueGetter: util.fieldGetter('AttackType'),
    ...util.selectFilter({
      order: 'asc',
    }),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}

export function abilityColDamageTable(util: AbilityTableUtils) {
  return util.colDef<string[]>({
    colId: 'damageTableRow',
    headerValueGetter: () => 'Damage Table Row',
    valueGetter: util.fieldGetter('DamageTableRow'),
    ...util.selectFilter({
      order: 'asc',
    }),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}

export function abilityColDamageTableOverride(util: AbilityTableUtils) {
  return util.colDef<string[]>({
    colId: 'damageTableRowOverride',
    headerValueGetter: () => 'Damage Table Row Override',
    valueGetter: util.fieldGetter('DamageTableRowOverride'),
    ...util.selectFilter({
      order: 'asc',
    }),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}

export function abilityColRemoteDamageTable(util: AbilityTableUtils) {
  return util.colDef<string[]>({
    colId: 'remoteDamageTableRow',
    headerValueGetter: () => 'Remote Damage TableRow',
    valueGetter: util.fieldGetter('RemoteDamageTableRow'),
    ...util.selectFilter({
      order: 'asc',
    }),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
  })
}

export function abilityColAfterAction(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'afterAction',
    headerValueGetter: () => 'After Action',
    valueGetter: util.fieldGetter('AfterAction'),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function abilityColOnAction(util: AbilityTableUtils) {
  return util.colDef<string[]>({
    colId: 'onAction',
    headerValueGetter: () => 'On Action',
    valueGetter: ({ data }) => {
      const result = Object.keys(data)
        .filter((it) => it.startsWith('On') && !!data[it])
        .map((it) => humanize(it).split(' '))
        .map((it) => (it[0] === 'On' ? it.slice(1).join('') : null))
        .filter((it) => !!it)
      return result.length ? result : null
    },
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function abilityStatusEffectCategories(util: AbilityTableUtils) {
  return util.colDef<string[]>({
    colId: 'statusEffectCategories',
    autoHeight: true,
    hide: true,
    headerValueGetter: () => 'Status Effect Categories',
    valueGetter: util.fieldGetter('StatusEffectCategories'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function abilityStatusEffectCategoriesList(util: AbilityTableUtils) {
  return util.colDef<string[]>({
    colId: 'statusEffectCategoriesList',
    autoHeight: true,
    hide: true,
    headerValueGetter: () => 'SE Categories List',
    valueGetter: util.fieldGetter('StatusEffectCategoriesList'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function abilityStatusEffectDurationCats(util: AbilityTableUtils) {
  return util.colDef<string[]>({
    colId: 'statusEffectDurationCats',
    autoHeight: true,
    hide: true,
    headerValueGetter: () => 'SE Duration Cats',
    valueGetter: util.fieldGetter('StatusEffectDurationCats'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function abilityTargetStatusEffectCategory(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'targetStatusEffectCategory',
    autoHeight: true,
    hide: true,
    headerValueGetter: () => 'Target SE Category',
    valueGetter: util.fieldGetter('TargetStatusEffectCategory'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}

export function abilityTargetStatusEffectDurationCategories(util: AbilityTableUtils) {
  return util.colDef<string>({
    colId: 'targetStatusEffectDurationCats',
    autoHeight: true,
    hide: true,
    headerValueGetter: () => 'Target SE Duration Cats',
    valueGetter: util.fieldGetter('TargetStatusEffectDurationCats'),
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
