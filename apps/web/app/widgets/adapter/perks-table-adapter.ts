import { Injectable, Optional } from '@angular/core'
import { Ability, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, switchMap } from 'rxjs'
import { IconComponent, nwdbLinkUrl, NwService } from '~/nw'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { humanize, shareReplayRefCount } from '~/utils'
import { TranslateService } from '~/i18n'
import { getPerksInherentMODs, hasPerkInherentAffix } from '~/nw/utils'
import { ExprContextService } from './exp-context.service'

@Injectable()
export class PerksTableAdapterConfig {
  source: Observable<Perks[]>
}

@Injectable()
export class PerksTableAdapter extends DataTableAdapter<Perks> {
  public static provider(config?: PerksTableAdapterConfig) {
    const provider = []
    if (config) {
      provider.push({
        provide: PerksTableAdapterConfig,
        useValue: config,
      })
    }
    provider.push(DataTableAdapter.provideClass(PerksTableAdapter))
    return provider
  }

  public entityID(item: Perks): string {
    return item.PerkID
  }

  public entityCategory(item: Perks): string {
    return item.PerkType
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return {
      ...base,
      rowSelection: 'single',

      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 74,
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) => {
              return m('a', { target: '_blank', href: nwdbLinkUrl('perk', data.PerkID) }, [
                m(IconComponent, {
                  src: data.IconPath,
                  class: `w-9 h-9 nw-icon`,
                }),
              ])
            },
          }),
        },
        {
          headerName: 'Name',
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
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { value } }) => {
              return m('div.flex.flex-col.text-sm', [
                value.name && m('span', value.name),
                value.prefix && m('span.italic.text-accent', `${value.prefix} …`),
                value.suffix && m('span.italic.text-accent', `… ${value.suffix}`),
              ])
            },
          }),
        },
        {
          width: 500,
          headerName: 'Description',
          wrapText: true,
          autoHeight: true,
          cellClass: ['multiline-cell', 'text-primary', 'italic', 'py-2'],
          filterValueGetter: ({ data }) => {
            return this.i18n.get(data.Description)
          },
          cellRenderer: this.asyncCell(
            (data) => {
              if (hasPerkInherentAffix(data)) {
                return this.nw.db.affixStatsMap.pipe(
                  map((stats) => {
                    const affix = stats.get(data.Affix)
                    return getPerksInherentMODs(data, affix, 600)
                      .map((it) => {
                        return `<b>${this.i18n.get(it.label)}</b> ${it.value}`
                      })
                      .join('<br>')
                  })
                )
              }
              return combineLatest({
                ctx: this.ctx.value,
                text: this.i18n.observe(data.Description),
              }).pipe(
                switchMap(({ ctx, text }) => {
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
            {
              trustHtml: true,
            }
          ),
        },
        {
          headerName: 'Type',
          field: this.fieldName('PerkType'),
          width: 120,
          filter: SelectboxFilter,
        },
        {
          headerName: 'Item Class GS Bonus',
          field: this.fieldName('ItemClassGSBonus'),
          children: [
            {
              headerName: 'Class',
              valueGetter: this.valueGetter(({ data }) => {
                return data.ItemClassGSBonus?.split(':')[0]
              }),
              width: 90,
              filter: SelectboxFilter,
            },
            {
              headerName: 'GS',
              valueGetter: this.valueGetter(({ data }) => {
                return data.ItemClassGSBonus?.split(':')[1]
              }),
              width: 50,
              filter: false,
            },
          ],
        },
        {
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
        },
        {
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
        },
        {
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
        },
        {
          headerName: 'IsStackableAbility',
          filter: SelectboxFilter,
          valueGetter: this.valueGetter(({ data }) => {
            const ability = data['$ability'] as Ability
            return ability?.IsStackableAbility
          }),
        },
      ],
    }
  }

  public entities: Observable<Perks[]> = defer(() => combineLatest({
    perks: this.config?.source || this.nw.db.perks,
    abilities: this.nw.db.abilitiesMap,
    affixstats: this.nw.db.affixstatsMap
  }))
  .pipe(map(({ perks, abilities, affixstats }) => {
    return perks.map((it) => {
      return {
        ...it,
        //$ability: abilities.get(it.EquipAbility),
        $affix: affixstats.get(it.Affix)
      }
    })
  }))
  .pipe(shareReplayRefCount(1))

  public constructor(
    private nw: NwService,
    private i18n: TranslateService,
    @Optional()
    private config: PerksTableAdapterConfig,
    private ctx: ExprContextService
  ) {
    super()
  }
}
