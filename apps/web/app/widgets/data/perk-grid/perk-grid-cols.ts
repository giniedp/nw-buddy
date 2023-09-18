import {
  explainPerk,
  explainPerkAttributeMods,
  getPerkItemClassGSBonus,
  getPerkItemClassGsBonus,
} from '@nw-data/common'
import { Ability, Perks } from '@nw-data/generated'
import { Observable, combineLatest, map, switchMap } from 'rxjs'
import { NwExpressionContextService } from '~/nw/expression'
import { SelectFilter } from '~/ui/ag-grid'
import { DataGridUtils } from '~/ui/data-grid'
import { humanize } from '~/utils'

export type PerkGridUtils = DataGridUtils<PerkGridRecord>
export type PerkGridRecord = Perks & {
  $ability: Ability
}

export function perkCol(util: PerkGridUtils) {
  //
}

export function perkColIcon(util: PerkGridUtils) {
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
          attrs: { target: '_blank', href: util.nwLink.link('perk', String(data.PerkID)) },
        },
        util.elItemIcon({
          class: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
          icon: data.IconPath,
        })
      )
    }),
  })
}

export function perkColName(util: PerkGridUtils) {
  return util.colDef({
    colId: 'name',
    headerValueGetter: () => 'Name',
    wrapText: true,
    autoHeight: true,
    width: 300,
    valueGetter: util.valueGetter(({ data }) => {
      return {
        name: data.DisplayName && util.i18n.get(data.DisplayName),
        secondary: data.SecondaryEffectDisplayName && util.i18n.get(data.SecondaryEffectDisplayName),
        suffix: data.AppliedSuffix && util.i18n.get(data.AppliedSuffix),
        prefix: data.AppliedPrefix && util.i18n.get(data.AppliedPrefix),
      }
    }),
    filterValueGetter: ({ data }) => {
      const name = data.DisplayName && util.i18n.get(data.DisplayName)
      const secondary = data.SecondaryEffectDisplayName && util.i18n.get(data.SecondaryEffectDisplayName)
      const suffix = data.AppliedSuffix && util.i18n.get(data.AppliedSuffix)
      const prefix = data.AppliedPrefix && util.i18n.get(data.AppliedPrefix)
      return [name || '', secondary || '', suffix || '', prefix || ''].join(' ')
    },
    cellRenderer: util.cellRenderer(({ value }) => {
      return util.el('div.flex.flex-col.text-sm', {}, [
        value.name ? util.el('span', { text: value.name }) : null,
        value.secondary ? util.el('span', { text: value.secondary }) : null,
        value.prefix ? util.el('span', { text: `${value.prefix} …`, class: ['italic', 'text-accent'] }) : null,
        value.suffix ? util.el('span', { text: `… ${value.suffix}`, class: ['italic', 'text-accent'] }) : null,
      ])
    }),
  })
}

export function perkColDescription(util: PerkGridUtils, ctx: NwExpressionContextService) {
  return util.colDef({
    colId: 'description',
    headerValueGetter: () => 'Description',
    width: 500,
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
    filterValueGetter: ({ data }) => util.i18n.get(data.Description),
    valueGetter: ({ data }) => util.i18n.get(data.Description),
    cellRenderer: util.cellRendererAsync(),
    cellRendererParams: util.cellRendererAsyncParams<string>({
      source: ({ data }) => {
        return combineLatest({
          ctx: ctx.value,
          stats: util.db.affixStatsMap,
        }).pipe(
          switchMap(({ ctx, stats }) => {
            const context = {
              itemId: data.PerkID,
              gearScore: ctx.gs,
              charLevel: ctx.level,
            }

            if (ctx.gsBonus) {
              const gsBonus = getPerkItemClassGSBonus(data)
              context.gearScore += gsBonus?.value || 0
            }

            const result: Array<Observable<string>> = []
            const mods = explainPerkAttributeMods({
              perk: data,
              affix: stats.get(data.Affix),
              gearScore: context.gearScore,
            })
            for (const mod of mods) {
              result.push(
                util.expr.solve({
                  attribute1: '…',
                  attribute2: '…',
                  text: `${util.i18n.get(mod.label || '')} ${util.i18n.get(mod.description || '')}`,
                  ...context,
                  ...(mod.context || {}),
                })
              )
            }
            result.push(
              util.expr.solve({
                text: util.i18n.get(data.Description || data.StatDisplayText),
                ...context,
              })
            )
            return combineLatest(result).pipe(map((it) => it.join('<br>')))
          })
        )
      },
      update: (el, text) => {
        el.innerHTML = util.lineBreaksToHtml(text)
      },
    }),
  })
}
export function perkColPerkType(util: PerkGridUtils) {
  return util.colDef({
    colId: 'perkType',
    headerValueGetter: () => 'Type',
    valueGetter: util.fieldGetter('PerkType'),
    width: 120,
    filter: SelectFilter,
  })
}

export function perkColItemClassGSBonus(util: PerkGridUtils) {
  return util.colGroupDef({
    colId: 'itemClassGSBonus',
    field: util.fieldName('ItemClassGSBonus'),
    headerName: 'Item Class GS Bonus',
    marryChildren: true,
    children: [
      util.colDef({
        colId: 'itemClassGSBonusClass',
        headerValueGetter: () => 'Class',
        valueGetter: util.valueGetter(({ data }) => {
          return getPerkItemClassGsBonus(data).map(({ itemClass }) => itemClass)
        }),
        cellRenderer: ({ value }) => `
          <span class="flex flex-col">
           ${value?.map((it: string) => `<span>${it}</span>`)?.join('')}
          </span>
        `,
        width: 90,
        minWidth: 90,
        maxWidth: 90,
        resizable: false,
        filter: SelectFilter,
      }),
      util.colDef({
        colId: 'itemClassGSBonusGS',
        headerValueGetter: () => 'GS',
        headerName: 'GS',
        valueGetter: util.valueGetter(({ data }) => {
          return getPerkItemClassGsBonus(data).map(({ bonus }) => bonus)
        }),
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
export function perkColItemClass(util: PerkGridUtils) {
  return util.colDef({
    colId: 'itemClass',
    headerValueGetter: () => 'Item Class',
    width: 500,
    valueGetter: util.fieldGetter('ItemClass'),
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    filter: SelectFilter,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function perkColExclusiveLabels(util: PerkGridUtils) {
  return util.colDef({
    colId: 'exclusiveLabels',
    headerValueGetter: () => 'Exclusive Labels',
    valueGetter: util.fieldGetter('ExclusiveLabels'),
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    filter: SelectFilter,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filterParams: SelectFilter.params({
      showSearch: true,
    }),
  })
}
export function perkColExcludeItemClass(util: PerkGridUtils) {
  return util.colDef({
    colId: 'excludeItemClass',
    headerValueGetter: () => 'Exclude Item Class',
    valueGetter: util.fieldGetter('ExcludeItemClass'),
    wrapText: true,
    autoHeight: true,
    cellClass: ['multiline-cell', 'py-2'],
    filter: SelectFilter,
    cellRenderer: util.tagsRenderer({ transform: humanize }),
    filterParams: SelectFilter.params({}),
  })
}
export function perkColIsStackableAbility(util: PerkGridUtils) {
  return util.colDef({
    colId: 'isStackableAbility',
    headerValueGetter: () => 'Is Stackable Ability',
    filter: SelectFilter,
    valueGetter: util.valueGetter(({ data }) => {
      const ability = data.$ability
      return ability?.IsStackableAbility
    }),
  })
}
