import { Injectable } from '@angular/core'
import { Statuseffect, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { IconComponent, NwService } from '~/core/nw'
import { mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'


function fieldName(key: keyof Statuseffect) {
  return key
}

function field(item: any, key: keyof Statuseffect) {
  return item[key]
}

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
          cellRenderer: mithrilCell<Statuseffect>({
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
          valueGetter: ({ data }) => {
            return this.nw.translate(field(data, 'DisplayName'))
          },
          width: 300,
        },
        {
          field: fieldName('EffectCategories'),
        },
        {
          field: fieldName('EffectDurationMods'),
        },
        {
          field: fieldName('EffectPotencyMods'),
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
