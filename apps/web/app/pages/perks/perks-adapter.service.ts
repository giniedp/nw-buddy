import { Injectable } from '@angular/core'
import { Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, Observable, shareReplay } from 'rxjs'
import { NwService } from '~/core/nw'
import { DataTableAdapter } from '~/ui/data-table'

function fieldName(key: keyof Perks) {
  return key
}

function field(item: any, key: keyof Perks) {
  return item[key]
}

@Injectable()
export class PerksAdapterService extends DataTableAdapter<Perks> {
  public entityID(item: Perks): string {
    return item.PerkID
  }

  public entityCategory(item: Perks): string {
    return item.PerkType
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
            const iconPath = this.nw.iconPath(field(data, 'IconPath'))
            const icon = this.nw.renderIcon(iconPath, {
              size: 38,
              rarity: rarity,
            })
            return `<a href="${this.nw.nwdbLinkUrl('perk', field(data, 'PerkID'))}" target="_blank">${icon}</a>`
          },
        },
        {
          headerName: 'Name',
          valueGetter: ({ data }) => {
            const name = field(data, 'DisplayName')
            if (name) {
              return this.nw.translate(name)
            }
            const suffix = field(data, 'AppliedSuffix')
            if (suffix) {
              return `${field(data, 'ExclusiveLabels')}: ${this.nw.translate(suffix)}`
            }
            return ''
          },
          width: 300,
        },
        {
          headerName: 'Type',
          field: fieldName('PerkType'),
          width: 100,
        },
        {
          headerName: 'Prefix',
          valueGetter: ({ data }) => this.nw.translate(field(data, 'AppliedPrefix')),
          width: 150,
        },
        {
          headerName: 'Suffix',
          valueGetter: ({ data }) => this.nw.translate(field(data, 'AppliedSuffix')),
          width: 150,
        },
        {
          field: fieldName('PerkID'),
          hide: true,
        },
        {
          field: fieldName('Tier'),
          width: 100,
        },
        {
          field: fieldName('ItemClass'),
        },

        {
          field: fieldName('ExclusiveLabels'),
        },
        {
          field: fieldName('ExcludeItemClass'),
        },
      ],
    })
  }

  public entities: Observable<Perks[]> = defer(() => {
    return this.nw.db.perks
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  public constructor(private nw: NwService) {
    super()
  }
}
