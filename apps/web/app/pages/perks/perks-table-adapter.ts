import { Injectable } from '@angular/core'
import { ItemDefinitionMaster, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { combineLatest, defer, map, Observable, shareReplay, switchMap } from 'rxjs'
import { IconComponent, nwdbLinkUrl, NwService } from '~/core/nw'
import { SelectboxFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { humanize, shareReplayRefCount } from '~/core/utils'
import { TranslateService } from '~/core/i18n'
import { getPerkAffixStat, hasPerkAffixStats } from '~/core/nw/utils'

@Injectable()
export class PerksAdapterService extends DataTableAdapter<Perks> {
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
          getQuickFilterText: ({ value }) => {
            return [value.name || '', value.suffix || '', value.prefix || ''].join(' ')
          },
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { value }}) => {
              return m('div.flex.flex-col.text-sm', [
                value.name && m('span', value.name),
                value.prefix && m('span.italic.text-accent', `${value.prefix} …`),
                value.suffix && m('span.italic.text-accent', `… ${value.suffix}`),
              ])
            }
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
          cellRenderer: this.asyncCell((data) => {
            if (hasPerkAffixStats(data)) {
              return this.nw.db.affixStatsMap.pipe(map((stats) => {
                const affix = stats.get(data.Affix)
                return getPerkAffixStat(data, affix, 600).map((it) => {
                  return `<b>${this.i18n.get(it.label)}</b> ${it.value}`
                }).join('<br>')
              }))
            }
            return this.i18n.observe(data.Description).pipe(switchMap((value) => {
              return this.nw.expression.solve({
                text: value,
                charLevel: 60,
                gearScore: 600,
                itemId: data.PerkID,
              })
            }))
          }, {
            trustHtml: true
          })
        },
        {
          headerName: 'Type',
          field: this.fieldName('PerkType'),
          width: 100,
          filter: SelectboxFilter,
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
            showSearch: true
          })
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
            showSearch: true
          })
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
            showSearch: false
          })
        },
      ],
    }
  }

  public entities: Observable<Perks[]> = defer(() => {
    return this.nw.db.perks
  }).pipe(
    shareReplayRefCount(1)
  )

  public constructor(private nw: NwService, private i18n: TranslateService) {
    super()
  }
}
