import { Injectable } from '@angular/core'
import { Statuseffect, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'

@Injectable()
export class StatusEffectsAdapterService extends DataTableAdapter<Statuseffect> {
  public entityID(item: Statuseffect): string {
    return item.StatusID
  }

  public entityCategory(item: Statuseffect): string {
    return item['$source']
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 74,
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: this.nw.nwdbUrl('status-effect', data.StatusID) }, [
                m(IconComponent, {
                  src: this.nw.iconPath(data.PlaceholderIcon || data['IconPath']),
                  class: `w-9 h-9 nw-icon`,
                }),
              ]),
          }),
        },
        {
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.nw.translate(data.DisplayName)),
          width: 300,
        },
        {
          field: this.fieldName('EffectCategories'),
        },
        {
          field: this.fieldName('EffectDurationMods'),
        },
        {
          field: this.fieldName('EffectPotencyMods'),
        },
      ],
    })
  }

  public entities: Observable<Statuseffect[]> = defer(() => {
    return this.nw.db.statusEffects
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  private perks: Map<string, Perks>

  public constructor(private nw: NwService) {
    super()
  }
}
