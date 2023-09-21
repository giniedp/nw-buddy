import { Injectable, Optional } from '@angular/core'
import {
  getPerkItemClassGSBonus,
  getPerkItemClassGsBonus,
  getPerksInherentMODs,
  hasPerkInherentAffix,
  isPerkGenerated,
  isPerkInherent,
} from '@nw-data/common'
import { Ability, COLS_AFFIXSTATS, COLS_PERKS, Perks } from '@nw-data/generated'
import { ColDef, ColGroupDef, GridOptions } from '@ag-grid-community/core'
import { Observable, combineLatest, defer, map, of, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService, sanitizeHtml } from '~/nw'
import { NwTextContextService, NwExpressionService } from '~/nw/expression'
import { SelectFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'

@Injectable()
export class PerksTableAdapter extends DataTableAdapter<Perks> {
  public static provider(config?: DataTableAdapterOptions<Perks>) {
    return dataTableProvider({
      adapter: PerksTableAdapter,
      options: config,
    })
  }

  public entityID(item: Perks): string {
    return item.PerkID
  }

  public entityCategory(item: Perks): DataTableCategory {
    return {
      icon: null,
      label: isPerkInherent(item) ? 'Attributes' : isPerkGenerated(item) ? 'Perks' : item.PerkType,
      value: item.PerkType,
    }
  }
  public override get persistStateId(): string {
    return this.config?.persistStateId
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colGroupDef({
          headerName: 'Perk',
          marryChildren: true,
          children: [
            this.colDef({
              colId: 'icon',
              headerValueGetter: () => 'Icon',
              resizable: false,
              sortable: false,
              filter: false,
              pinned: true,
              width: 62,
              cellRenderer: this.cellRenderer(({ data }) => {
                return this.createLinkWithIcon({
                  target: '_blank',
                  href: this.info.link('perk', String(data.PerkID)),
                  icon: data.IconPath,
                  iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
                })
              }),
            }),
            this.colDef({
              colId: 'name',
              headerValueGetter: () => 'Name',
              wrapText: true,
              autoHeight: true,
              width: 300,
              valueGetter: this.valueGetter(({ data }) => {
                return {
                  name: data.DisplayName && this.i18n.get(data.DisplayName),
                  secondary: data.SecondaryEffectDisplayName && this.i18n.get(data.SecondaryEffectDisplayName),
                  suffix: data.AppliedSuffix && this.i18n.get(data.AppliedSuffix),
                  prefix: data.AppliedPrefix && this.i18n.get(data.AppliedPrefix),
                }
              }),
              filterValueGetter: ({ data }) => {
                const name = data.DisplayName && this.i18n.get(data.DisplayName)
                const secondary = data.SecondaryEffectDisplayName && this.i18n.get(data.SecondaryEffectDisplayName)
                const suffix = data.AppliedSuffix && this.i18n.get(data.AppliedSuffix)
                const prefix = data.AppliedPrefix && this.i18n.get(data.AppliedPrefix)
                return [name || '', secondary || '', suffix || '', prefix || ''].join(' ')
              },
              cellRenderer: this.cellRenderer(({ value }) => {
                return this.createElement({
                  tag: 'div',
                  classList: ['flex', 'flex-col', 'text-sm'],
                  children: [
                    value.name
                      ? {
                          tag: 'span',
                          classList: [],
                          text: value.name as string,
                        }
                      : null,
                    value.secondary
                      ? {
                          tag: 'span',
                          classList: [],
                          text: value.secondary as string,
                        }
                      : null,
                    value.prefix
                      ? {
                          tag: 'span',
                          classList: ['italic', 'text-accent'],
                          text: `${value.prefix} …`,
                        }
                      : null,
                    value.suffix
                      ? {
                          tag: 'span',
                          classList: ['italic', 'text-accent'],
                          text: `… ${value.suffix}`,
                        }
                      : null,
                  ],
                })
              }),
            }),
            this.colDef({
              colId: 'description',
              headerValueGetter: () => 'Description',
              width: 500,
              wrapText: true,
              autoHeight: true,
              cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
              filterValueGetter: ({ data }) => this.i18n.get(data.Description),
              valueGetter: ({ data }) => this.i18n.get(data.Description),
              cellRenderer: this.cellRendererAsync(),
              cellRendererParams: this.cellRendererAsyncParams<string>({
                source: ({ data }) => {
                  // const stat = data.StatDisplayText && this.i18n.get(data.StatDisplayText)
                  return combineLatest({
                    ctx: this.ctx.state$,
                    text: this.i18n.observe([data.Description, data.StatDisplayText]),
                    stats: this.db.affixStatsMap,
                  }).pipe(
                    switchMap(({ ctx, text, stats }) => {
                      if (hasPerkInherentAffix(data)) {
                        const affix = stats.get(data.Affix)
                        const result = getPerksInherentMODs(data, affix, ctx.gearScore)
                          .map((it) => `+${Math.floor(it.value)} <b>${this.i18n.get(it.label)}</b>`)
                          .join('<br>')
                        return of(result)
                      }

                      const context = {
                        itemId: data.PerkID,
                        gearScore: ctx.gearScore,
                        charLevel: ctx.charLevel,
                      }
                      if (ctx.gearScoreBonus) {
                        const gsBonus = getPerkItemClassGSBonus(data)
                        context.gearScore += gsBonus?.value || 0
                      }
                      return this.expression.solve({
                        ...context,
                        text: text,
                      })
                    })
                  )
                },
                update: (el, text) => {
                  el.innerHTML = sanitizeHtml(this.makeLineBreaks(text))
                },
              }),
            }),
            this.colDef({
              colId: 'perkType',
              headerValueGetter: () => 'Type',
              valueGetter: this.valueGetter(({ data }) => data.PerkType),
              width: 120,
              filter: SelectFilter,
            }),
            {
              colId: 'itemClassGSBonus',
              headerName: 'Item Class GS Bonus',
              field: this.fieldName('ItemClassGSBonus'),
              marryChildren: true,
              children: [
                this.colDef({
                  colId: 'itemClassGSBonusClass',
                  headerValueGetter: () => 'Class',
                  valueGetter: this.valueGetter(({ data }) => {
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
                this.colDef({
                  colId: 'itemClassGSBonusGS',
                  headerValueGetter: () => 'GS',
                  headerName: 'GS',
                  valueGetter: this.valueGetter(({ data }) => {
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
            },
            this.colDef({
              colId: 'itemClass',
              headerValueGetter: () => 'Item Class',
              width: 500,
              wrapText: true,
              autoHeight: true,
              cellClass: ['multiline-cell', 'py-2'],
              valueGetter: this.valueGetter(({ data }) => data.ItemClass),
              filter: SelectFilter,
              cellRenderer: this.cellRendererTags(humanize),
              filterParams: SelectFilter.params({
                showSearch: true,
              }),
            }),
            this.colDef({
              colId: 'exclusiveLabels',
              headerValueGetter: () => 'Exclusive Labels',
              wrapText: true,
              autoHeight: true,
              cellClass: ['multiline-cell', 'py-2'],
              filter: SelectFilter,
              valueGetter: this.valueGetter(({ data }) => data.ExclusiveLabels),
              cellRenderer: this.cellRendererTags(humanize),
              filterParams: SelectFilter.params({
                showSearch: true,
              }),
            }),
            this.colDef({
              colId: 'excludeItemClass',
              headerValueGetter: () => 'Exclude Item Class',
              wrapText: true,
              autoHeight: true,
              cellClass: ['multiline-cell', 'py-2'],
              filter: SelectFilter,
              valueGetter: this.valueGetter(({ data }) => data.ExcludeItemClass),
              cellRenderer: this.cellRendererTags(humanize),
              filterParams: SelectFilter.params({}),
            }),
            this.colDef({
              colId: 'isStackableAbility',
              headerValueGetter: () => 'Is Stackable Ability',
              filter: SelectFilter,
              valueGetter: this.valueGetter(({ data }) => {
                const ability = data['$ability'] as Ability
                return ability?.IsStackableAbility
              }),
            }),
          ],
        }),
        this.colGroupDef({
          headerName: 'Affix',
          marryChildren: true,
          children: [],
        }),
      ],
    }).pipe(
      map((options) => {
        appendFields((options.columnDefs[0] as ColGroupDef).children, Array.from(Object.entries(COLS_PERKS)), '')
        appendFields(
          (options.columnDefs[1] as ColGroupDef).children,
          Array.from(Object.entries(COLS_AFFIXSTATS)),
          '$affix'
        )
        return options
      })
    )
  )

  public entities: Observable<Perks[]> = defer(() =>
    combineLatest({
      perks: this.config?.source || this.db.perks,
      affixstats: this.db.affixstatsMap,
    })
  )
    .pipe(
      map(({ perks, affixstats }) => {
        return perks.map((it) => {
          return {
            ...it,
            $affix: affixstats.get(it.Affix),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(
    private db: NwDbService,
    private expression: NwExpressionService,
    private i18n: TranslateService,
    @Optional()
    private config: DataTableAdapterOptions<Perks>,
    private ctx: NwTextContextService,
    private info: NwLinkService
  ) {
    super()
  }
}

function appendFields(columns: Array<ColDef>, fields: string[][], fieldPrefix: string) {
  for (const [field, type] of fields) {
    const exists = columns.find((col: ColDef) => col.colId?.toLowerCase() == field.toLowerCase())
    if (exists) {
      continue
    }
    const colDef: ColDef = {
      colId: field,
      headerValueGetter: () => humanize(field),
      valueGetter: ({ data }) => {
        if (fieldPrefix) {
          return data[fieldPrefix]?.[field]
        } else {
          return data[field]
        }
      },
      hide: true,
    }
    colDef.filter = SelectFilter
    colDef.filterParams = SelectFilter.params({
      showSearch: true,
    })
    if (type.includes('number')) {
      colDef.filter = 'agNumberColumnFilter'
      colDef.filterParams = null
    }
    columns.push(colDef)
  }
}
