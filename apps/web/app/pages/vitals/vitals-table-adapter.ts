import { Injectable } from '@angular/core'
import { Vitals } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { NwService, NwVitalsService } from '~/core/nw'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { shareReplayRefCount } from '~/core/utils'
import m from 'mithril'

@Injectable()
export class VitalsAdapterService extends DataTableAdapter<Vitals> {
  public entityID(item: Vitals): string {
    return item.VitalsID
  }

  public entityCategory(item: Vitals): string {
    return item.Family
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          width: 200,
          headerName: 'Name',
          pinned: true,
          valueGetter: this.valueGetter(({ data }) => this.nw.translate(data.DisplayName)),
          getQuickFilterText: ({ value }) => value,
          cellRenderer: this.mithrilCell({
            view: ({ attrs }) => m('a', {
              href: this.nw.nwdbUrl('creature', attrs.data.VitalsID),
              target: '_blank'
            }, [
              attrs.value
            ])
          })
        },
        {
          width: 200,
          field: this.fieldName('Level'),
          cellRenderer: this.mithrilCell({
            view: ({ attrs }) => {
              const icon = this.vitals.vitalMarkerIcon(attrs.data)
              return m('div.relative.h-full.w-full', [
                icon && m('img.block.object-cover.absolute.left-0.top-0.h-full.w-full', {
                  src: icon
                }),
                m('span.absolute.left-0.right-0.top-0.bottom-0.text-center.font-bold', attrs.value)
              ])

            }
          })
        },
        {
          field: this.fieldName('Family'),
          width: 125,
          getQuickFilterText: ({ value }) => value,
          filter: SelectboxFilter,
        },
        {
          field: this.fieldName('CreatureType'),
          width: 150,
          getQuickFilterText: ({ value }) => value,
          filter: SelectboxFilter,
        },
        {
          field: this.fieldName('LootDropChance'),
          cellClass: 'text-right',
          width: 150,
          valueGetter: this.valueGetter( ({ data }) => Math.round((Number(data.LootDropChance) || 0) * 100) ),
          valueFormatter: ({ value }) => `${value}%`
        },
        {
          headerName: 'Slash',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Slash')),
          cellRenderer: this.cellRendererDamage()
        },
        {
          headerName: 'Thrust',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Thrust')),
          cellRenderer: this.cellRendererDamage()
        },
        {
          headerName: 'Strike',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Strike')),
          cellRenderer: this.cellRendererDamage()
        },
        {
          headerName: 'Fire',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Fire')),
          cellRenderer: this.cellRendererDamage()
        },
        {
          headerName: 'Ice',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Ice')),
          cellRenderer: this.cellRendererDamage()
        },
        {
          headerName: 'Nature',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Nature')),
          cellRenderer: this.cellRendererDamage()
        },
        {
          headerName: 'Void',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Corruption')),
          cellRenderer: this.cellRendererDamage()
        },
        {
          headerName: 'Lighting',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Lightning')),
          cellRenderer: this.cellRendererDamage()
        },
        {
          headerName: 'Arcane',
          filter: false,
          width: 80,
          valueGetter: this.valueGetter(({ data }) => this.vitals.damageEffectivenessPercent(data, 'Arcane')),
          cellRenderer: this.cellRendererDamage()
        }
      ],
    })
  }

  public entities: Observable<Vitals[]> = defer(() => {
    return this.nw.db.vitals
  }).pipe(shareReplayRefCount(1))

  public constructor(private nw: NwService, private vitals: NwVitalsService) {
    super()
  }

  public cellRendererDamage() {
    return this.mithrilCell({
      view: ({ attrs }) => {
        if (!attrs.value) {
          return null
        }
        return m('div.flex.flex-row.items-center.justify-center.relative', [
          m('img.w-8.h-8.mr-1', {
            src: attrs.value < 0 ? this.vitals.iconWeakattack : this.vitals.iconStronattack
          }),
          m('span.font-bold', `${attrs.value > 0 ? '+' : ''}${attrs.value}%`  )
        ])
      },
    })
  }
}
