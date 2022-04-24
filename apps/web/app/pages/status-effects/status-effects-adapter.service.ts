import { Injectable } from '@angular/core'
import { Statuseffect, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { NwService } from '~/core/nw'
import { DataTableAdapter } from '~/ui/data-table'


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
          cellRenderer: ({ data }) => {
            const rarity = this.nw.itemRarity(data)
            const iconPath = this.nw.iconPath(field(data, 'PlaceholderIcon') || data.IconPath)
            const icon = this.nw.renderIcon(iconPath, {
              size: 38,
              rarity: rarity,
            })
            return `<a href="${this.nw.nwdbLinkUrl('status-effect', field(data, 'StatusID'))}" target="_blank">${icon}</a>`
          },
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
