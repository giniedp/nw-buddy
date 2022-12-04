import { Injectable, Optional } from '@angular/core'
import { Ability, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, of, switchMap } from 'rxjs'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl, NwService } from '~/nw'
import { getPerksInherentMODs, hasPerkInherentAffix, isPerkGenerated, isPerkInherent } from '~/nw/utils'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableAdapterOptions, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'
import { ExprContextService } from './exp-context.service'

@Injectable()
export class PerksTableAdapter extends DataTableAdapter<Perks> {
  public static provider(config?: DataTableAdapterOptions<Perks>) {
    return dataTableProvider({
      adapter: PerksTableAdapter,
      options: config
    })
  }

  public entityID(item: Perks): string {
    return item.PerkID
  }

  public entityCategory(item: Perks): DataTableCategory {
    return {
      icon: null,
      label: isPerkInherent(item) ? 'Attributes' : isPerkGenerated(item) ? 'Perks' : item.PerkType,
      value: item.PerkType
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
              href: nwdbLinkUrl('perk', String(data.PerkID)),
              icon: data.IconPath,
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1']
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
              suffix: data.AppliedSuffix && this.i18n.get(data.AppliedSuffix),
              prefix: data.AppliedPrefix && this.i18n.get(data.AppliedPrefix),
            }
          }),
          filterValueGetter: ({ data }) => {
            const name = data.DisplayName && this.i18n.get(data.DisplayName)
            const suffix = data.AppliedSuffix && this.i18n.get(data.AppliedSuffix)
            const prefix = data.AppliedPrefix && this.i18n.get(data.AppliedPrefix)
            return [name || '', suffix || '', prefix || ''].join(' ')
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
              return combineLatest({
                ctx: this.ctx.value,
                text: this.i18n.observe(data.Description),
                stats: this.nw.db.affixStatsMap,
              }).pipe(
                switchMap(({ ctx, text, stats }) => {
                  if (hasPerkInherentAffix(data)) {
                    const affix = stats.get(data.Affix)
                    const result = getPerksInherentMODs(data, affix, ctx.gs)
                      .map((it) => `+${it.value} <b>${this.i18n.get(it.label)}</b>`)
                      .join('<br>')
                    return of(result)
                  }

                  let gs = ctx.gs
                  if (data.ItemClassGSBonus && ctx.gsBonus) {
                    gs += Number(data.ItemClassGSBonus.split(':')[1]) || 0
                  }
                  return this.nw.expression.solve({
                    text: text,
                    charLevel: ctx.level,
                    gearScore: gs,
                    itemId: data.PerkID,
                  })
                })
              )
            },
            update: (el, text) => {
              el.innerHTML = this.makeLineBreaks(text)
            },
          }),
        }),
        this.colDef({
          colId: 'type',
          headerValueGetter: () => 'Type',
          field: this.fieldName('PerkType'),
          width: 120,
          filter: SelectboxFilter,
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
                return data.ItemClassGSBonus?.split(':')[0]
              }),
              width: 90,
              minWidth: 90,
              maxWidth: 90,
              resizable: false,
              filter: SelectboxFilter,
            }),
            this.colDef({
              colId: 'itemClassGSBonusGS',
              headerValueGetter: () => 'GS',
              headerName: 'GS',
              valueGetter: this.valueGetter(({ data }) => {
                return data.ItemClassGSBonus?.split(':')[1]
              }),
              width: 50,
              minWidth: 50,
              maxWidth: 50,
              resizable: false,

            }),
          ],
        },
        this.colDef({
          colId: 'itemClass',
          headerValueGetter: () => 'Item Class',
          width: 500,
          field: this.fieldName('ItemClass'),
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'py-2'],
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(humanize),
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: true,
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'exclusiveLabels',
          headerValueGetter: () => 'Exclusive Labels',
          field: this.fieldName('ExclusiveLabels'),
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'py-2'],
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(humanize),
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: true,
            showSearch: true,
          }),
        }),
        this.colDef({
          colId: 'excludeItemClass',
          headerValueGetter: () => 'Exclude Item Class',
          field: this.fieldName('ExcludeItemClass'),
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'py-2'],
          filter: SelectboxFilter,
          cellRenderer: this.cellRendererTags(humanize),
          filterParams: SelectboxFilter.params({
            showCondition: true,
            conditionAND: true,
            showSearch: false,
          }),
        }),
        this.colDef({
          colId: 'isStackableAbility',
          headerValueGetter: () => 'Is Stackable Ability',
          filter: SelectboxFilter,
          valueGetter: this.valueGetter(({ data }) => {
            const ability = data['$ability'] as Ability
            return ability?.IsStackableAbility
          }),
        }),
      ],
    })
  )

  public entities: Observable<Perks[]> = defer(() =>
    combineLatest({
      perks: this.config?.source || this.nw.db.perks,
      abilities: this.nw.db.abilitiesMap,
      affixstats: this.nw.db.affixstatsMap,
    })
  )
    .pipe(
      map(({ perks, abilities, affixstats }) => {
        return perks.map((it) => {
          return {
            ...it,
            //$ability: abilities.get(it.EquipAbility),
            $affix: affixstats.get(it.Affix),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(
    private nw: NwService,
    private i18n: TranslateService,
    @Optional()
    private config: DataTableAdapterOptions<Perks>,
    private ctx: ExprContextService
  ) {
    super()
  }
}
