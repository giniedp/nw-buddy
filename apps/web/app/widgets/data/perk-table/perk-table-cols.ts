import {
  NW_FALLBACK_ICON,
  explainPerkMods,
  getItemIconPath,
  getItemId,
  getItemRarity,
  getPerkItemClassGSBonus,
  getPerkItemClassGsBonus,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import {
  AbilityData,
  AffixStatData,
  COLS_ABILITYDATA,
  COLS_AFFIXSTATDATA,
  COLS_PERKDATA,
  MasterItemDefinitions,
  PerkData,
} from '@nw-data/generated'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { NwTextContextService } from '~/nw/expression'
import { ExpressionFilter } from '~/ui/data/ag-grid/expression-filter'
import { TableGridUtils } from '~/ui/data/table-grid'
import { humanize } from '~/utils'

export type PerkTableUtils = TableGridUtils<PerkTableRecord>
export type PerkTableRecord = PerkData & {
  $ability?: AbilityData
  $affix?: AffixStatData
  $items?: MasterItemDefinitions[]
}

export function perkColIcon(util: PerkTableUtils) {
  return util.colDef({
    colId: 'icon',
    headerValueGetter: () => 'Icon',
    resizable: false,
    sortable: false,
    filter: ExpressionFilter,
    filterParams: ExpressionFilter.params({
      fields: Object.keys(COLS_PERKDATA),
      fieldPaths: [
        ...Object.keys(COLS_AFFIXSTATDATA).map((it) => `$affix.${it}`),
        ...Object.keys(COLS_ABILITYDATA).map((it) => `$ability.${it}`),
      ],
    }),
    pinned: true,
    width: 62,
    cellRenderer: util.cellRenderer(({ data }) => {
      return util.elA(
        {
          attrs: { target: '_blank', href: util.tipLink('perk', String(data.PerkID)) },
        },
        util.elItemIcon({
          class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          icon: data.IconPath,
        }),
      )
    }),
  })
}

export function perkColId(util: PerkTableUtils) {
  return util.colDef<string>({
    colId: 'perkId',
    headerValueGetter: () => 'Perk ID',
    field: 'PerkID',
    hide: true,
  })
}

export function perkCraftMod(util: PerkTableUtils) {
  return util.colDef<string[]>({
    colId: 'perkCraftModIds',
    headerClass: 'bg-secondary/15',
    headerValueGetter: () => 'Craft Mod',
    valueGetter: ({ data }) => data.$items?.map((it) => it.ItemID),
    getQuickFilterText: ({ data }) => {
      return data.$items?.map((it) => util.tl8(it.Name)).join(', ')
    },
    ...util.selectFilter({
      order: 'asc',
      search: true,
      getOptions: ({ data }) => {
        const items = data.$items
        if (!items?.length) {
          return []
        }
        return items.map((item) => {
          return {
            id: getItemId(item),
            label: util.i18n.get(item.Name),
            icon: getItemIconPath(item),
          }
        })
      },
    }),
    cellRenderer: util.cellRenderer(({ data }) => {
      const items = data.$items
      if (!items?.length) {
        return null
      }
      return util.el('div.flex.flex-row.items-center.h-full', {}, [
        ...items.map((item) =>
          util.elA(
            {
              class: ['block', 'flex-nonw'],
              attrs: {
                target: '_blank',
                href: util.tipLink('item', getItemId(item)),
              },
            },
            util.el('div.flex.flex-row.items-center.h-full', {}, [
              util.elItemIcon({
                class: ['w-8', 'h-8'],
                icon: getItemIconPath(item) || NW_FALLBACK_ICON,
                isArtifact: isMasterItem(item) && isItemArtifact(item),
                isNamed: isMasterItem(item) && isItemNamed(item),
                rarity: getItemRarity(item),
              }),
              util.el('span.ml-2', { text: util.tl8(item.Name) }),
            ]),
          ),
        ),
      ])
    }),
  })
}

export function perkColName(util: PerkTableUtils) {
  return util.colDef<{ name: string; secondary: string; suffix: string; prefix: string }>({
    colId: 'name',
    headerValueGetter: () => 'Name',
    wrapText: true,
    autoHeight: true,
    width: 300,
    comparator: (a, b) => {
      const nameA = a.name || a.secondary || ''
      const nameB = b.name || b.secondary || ''
      return nameA.localeCompare(nameB)
    },

    valueGetter: ({ data }) => {
      return {
        name: data.DisplayName && util.i18n.get(data.DisplayName),
        secondary: data.SecondaryEffectDisplayName && util.i18n.get(data.SecondaryEffectDisplayName),
        suffix: data.AppliedSuffix && util.i18n.get(data.AppliedSuffix),
        prefix: data.AppliedPrefix && util.i18n.get(data.AppliedPrefix),
      }
    },
    valueFormatter: ({ data }) => {
      const name = data.DisplayName && util.i18n.get(data.DisplayName)
      const secondary = data.SecondaryEffectDisplayName && util.i18n.get(data.SecondaryEffectDisplayName)
      const suffix = data.AppliedSuffix && util.i18n.get(data.AppliedSuffix)
      const prefix = data.AppliedPrefix && util.i18n.get(data.AppliedPrefix)
      return [name || '', secondary || '', suffix || '', prefix || ''].join(' ') as any
    },
    useValueFormatterForExport: true,
    filterValueGetter: ({ data }) => {
      const name = data.DisplayName && util.i18n.get(data.DisplayName)
      const secondary = data.SecondaryEffectDisplayName && util.i18n.get(data.SecondaryEffectDisplayName)
      const suffix = data.AppliedSuffix && util.i18n.get(data.AppliedSuffix)
      const prefix = data.AppliedPrefix && util.i18n.get(data.AppliedPrefix)
      return [name || '', secondary || '', suffix || '', prefix || ''].join(' ') as any
    },
    cellRenderer: util.cellRenderer(({ value }) => {
      return util.el('div.flex.flex-col.text-sm', {}, [
        value.name ? util.el('span', { text: value.name }) : null,
        value.secondary ? util.el('span', { text: value.secondary }) : null,
        value.prefix ? util.el('span', { text: `${value.prefix} …`, class: ['italic', 'text-accent'] }) : null,
        value.suffix ? util.el('span', { text: `… ${value.suffix}`, class: ['italic', 'text-accent'] }) : null,
      ])
    }),
    cellClass: ({ data, value }) => {
      if (value.name && data.DisplayName !== value.name) {
        return null
      }
      if (data.SecondaryEffectDisplayName && data.SecondaryEffectDisplayName !== value.secondary) {
        return null
      }
      return ['font-mono', 'text-neutral-content/50']
    },
  })
}

export function perkColDescription(util: PerkTableUtils, ctx: NwTextContextService) {
  return util.colDef<string>({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 500,
    wrapText: true,
    autoHeight: true,
    valueGetter: ({ data }) => util.i18n.get(data.Description),
    filterValueGetter: ({ data }) => util.i18n.get(data.Description),
    cellClass: ({ data, value }) => {
      if (data.Description !== value) {
        return ['multiline-cell', 'py-2', 'text-nw-description', 'italic']
      }
      return ['font-mono', 'text-neutral-content/50']
    },
    cellRenderer: util.cellRendererAsync(),
    cellRendererParams: util.cellRendererAsyncParams<string>({
      source: ({ data }) => {
        return combineLatest({
          ctx: ctx.state$,
          affix: util.db.affixStatsById(data.Affix),
        }).pipe(
          switchMap(({ ctx, affix }) => {
            const context = {
              itemId: data.PerkID,
              gearScore: ctx.gearScore,
              charLevel: ctx.charLevel,
            }
            if (ctx.gearScoreBonus) {
              const gsBonus = getPerkItemClassGSBonus(data)
              context.gearScore += gsBonus?.value || 0
            }

            const result: Array<Observable<string>> = []
            const mods = explainPerkMods({
              perk: data,
              affix: affix,
              gearScore: context.gearScore,
            })
            for (const mod of mods) {
              result.push(
                util.expr
                  .solve({
                    attribute1: '…',
                    attribute2: '…',
                    text: `${util.i18n.get(mod.label || '')} ${util.i18n.get(mod.description || '')}`,
                    ...context,
                    ...(mod.context || {}),
                  })
                  .pipe(map((it) => `<span class="text-sky-600 not-italic"> ${it} </span>`)),
              )
            }
            result.push(
              util.expr.solve({
                text: util.i18n.get(data.Description || data.StatDisplayText),
                ...context,
              }),
            )
            return combineLatest(result).pipe(map((it) => it.join('<br>')))
          }),
        )
      },
      update: (el, text) => {
        el.innerHTML = util.lineBreaksToHtml(text)
      },
    }),
  })
}

export function perkColPerkType(util: PerkTableUtils) {
  return util.colDef<string>({
    colId: 'perkType',
    headerValueGetter: () => 'Type',
    field: 'PerkType',
    width: 120,
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}

export function perkColItemClassGSBonus(util: PerkTableUtils) {
  return util.colGroupDef({
    colId: 'itemClassGSBonus',
    field: 'ItemClassGSBonus',
    headerName: 'Item Class GS Bonus',
    marryChildren: true,
    children: [
      util.colDef<string[]>({
        colId: 'itemClassGSBonusClass',
        headerValueGetter: () => 'Class',
        getQuickFilterText: () => '',
        valueGetter: ({ data }) => {
          return getPerkItemClassGsBonus(data).map(({ itemClass }) => itemClass)
        },
        cellRenderer: ({ value }) => `
          <span class="flex flex-col">
           ${value?.map((it: string) => `<span>${it}</span>`)?.join('')}
          </span>
        `,
        width: 90,
        minWidth: 90,
        maxWidth: 90,
        resizable: false,
        ...util.selectFilter({
          order: 'asc',
        }),
      }),
      util.colDef({
        colId: 'itemClassGSBonusGS',
        headerValueGetter: () => 'GS',
        getQuickFilterText: () => '',
        headerName: 'GS',
        valueGetter: ({ data }) => {
          return getPerkItemClassGsBonus(data).map(({ bonus }) => bonus)
        },
        cellRenderer: ({ value }) => `
          <span class="flex flex-col">
            ${value?.map((it: string) => `<span>${it}</span>`)?.join('')}
          </span>
        `,
        width: 75,
        minWidth: 75,
        maxWidth: 75,
        resizable: false,
      }),
    ],
  })
}
export function perkColItemClass(util: PerkTableUtils) {
  return util.colDef<string[]>({
    colId: 'itemClass',
    headerValueGetter: () => 'Item Class',
    width: 500,
    field: 'ItemClass',
    valueGetter: util.fieldGetter('ItemClass'),
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function perkColExclusiveLabels(util: PerkTableUtils) {
  return util.colDef<string[]>({
    colId: 'exclusiveLabels',
    headerValueGetter: () => 'Exclusive Labels',
    field: 'ExclusiveLabels',
    valueGetter: util.fieldGetter('ExclusiveLabels'),
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
      search: true,
    }),
  })
}
export function perkColExcludeItemClass(util: PerkTableUtils) {
  return util.colDef<string[]>({
    colId: 'excludeItemClass',
    headerValueGetter: () => 'Exclude Item Class',
    getQuickFilterText: () => '',
    field: 'ExcludeItemClass',
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
export function perkColIsStackableAbility(util: PerkTableUtils) {
  return util.colDef<boolean>({
    colId: 'isStackableAbility',
    headerValueGetter: () => 'Is Stackable Ability',
    getQuickFilterText: () => '',
    valueGetter: ({ data }) => {
      const ability = data.$ability
      return ability?.IsStackableAbility
    },
    ...util.selectFilter({
      order: 'asc',
    }),
  })
}
