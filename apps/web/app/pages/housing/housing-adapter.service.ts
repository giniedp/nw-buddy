import { Injectable } from '@angular/core'
import { Housingitems } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, map, Observable, shareReplay, tap } from 'rxjs'
import { NwService } from '~/core/nw'
import { CategoryFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'

function fieldName(key: keyof Housingitems) {
  return key
}

function field(item: any, key: keyof Housingitems) {
  return item[key]
}

@Injectable()
export class HousingAdapterService extends DataTableAdapter<Housingitems> {
  public entityID(item: Housingitems): string {
    return item.HouseItemID
  }

  public entityCategory(item: Housingitems): string {
    return item.UIHousingCategory
  }

  public buildGridOptions(base: GridOptions): GridOptions {
    return this.nw.gridOptions({
      ...base,
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 54,
          pinned: true,
          cellRenderer: ({ data }) => {
            const rarity = this.nw.itemRarity(data)
            const iconPath = this.nw.iconPath(field(data, 'IconPath'))
            const icon = this.nw.renderIcon(iconPath, {
              size: 38,
              rarity: rarity,
            })
            return `<a href="${this.nw.nwdbLinkUrl('item', field(data, 'HouseItemID'))}" target="_blank">${icon}</a>`
          },
        },
        {
          width: 300,
          headerName: 'Name',
          valueGetter: ({ data }) => this.nw.translate(field(data, 'Name')),
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: fieldName('HouseItemID'),
          hide: true,
        },
        {
          width: 100,
          headerName: 'Rarity',
          field: fieldName('ItemRarity'),
          filter: CategoryFilter,
        },
        {
          width: 80,
          field: fieldName('Tier'),
          filter: CategoryFilter,
          valueGetter: ({ data }) => this.nw.itemTierRoman(data),
        },
        {
          headerName: 'User Data',
          children: [
            {
              width: 80,
              headerName: 'Fav',
              valueGetter: ({ data }) => !!this.nw.itemPref.get(field(data, 'HouseItemID'))?.fav,
              cellRenderer: mithrilCell<Housingitems>({
                view: ({ attrs }) => {
                  const truIcon = `<svg class="block w-6 h-6 fill-primary" viewBox="0 0 576 512"><path d="M381.2 150.3L524.9 171.5C536.8 173.2 546.8 181.6 550.6 193.1C554.4 204.7 551.3 217.3 542.7 225.9L438.5 328.1L463.1 474.7C465.1 486.7 460.2 498.9 450.2 506C440.3 513.1 427.2 514 416.5 508.3L288.1 439.8L159.8 508.3C149 514 135.9 513.1 126 506C116.1 498.9 111.1 486.7 113.2 474.7L137.8 328.1L33.58 225.9C24.97 217.3 21.91 204.7 25.69 193.1C29.46 181.6 39.43 173.2 51.42 171.5L195 150.3L259.4 17.97C264.7 6.954 275.9-.0391 288.1-.0391C300.4-.0391 311.6 6.954 316.9 17.97L381.2 150.3z"/></svg>`
                  const falseIcon = `<svg class="block w-6 h-6 fill-primary opacity-50" viewBox="0 0 576 512"><path d="M287.9 0C297.1 0 305.5 5.25 309.5 13.52L378.1 154.8L531.4 177.5C540.4 178.8 547.8 185.1 550.7 193.7C553.5 202.4 551.2 211.9 544.8 218.2L433.6 328.4L459.9 483.9C461.4 492.9 457.7 502.1 450.2 507.4C442.8 512.7 432.1 513.4 424.9 509.1L287.9 435.9L150.1 509.1C142.9 513.4 133.1 512.7 125.6 507.4C118.2 502.1 114.5 492.9 115.1 483.9L142.2 328.4L31.11 218.2C24.65 211.9 22.36 202.4 25.2 193.7C28.03 185.1 35.5 178.8 44.49 177.5L197.7 154.8L266.3 13.52C270.4 5.249 278.7 0 287.9 0L287.9 0zM287.9 78.95L235.4 187.2C231.9 194.3 225.1 199.3 217.3 200.5L98.98 217.9L184.9 303C190.4 308.5 192.9 316.4 191.6 324.1L171.4 443.7L276.6 387.5C283.7 383.7 292.2 383.7 299.2 387.5L404.4 443.7L384.2 324.1C382.9 316.4 385.5 308.5 391 303L476.9 217.9L358.6 200.5C350.7 199.3 343.9 194.3 340.5 187.2L287.9 78.95z"/></svg>`
                  return m(
                    'div.h-full.flex.items-center',
                    {
                      onclick: () => {
                        this.nw.itemPref.toggleFavourite(attrs.data.HouseItemID)
                        attrs.api.refreshCells({
                          rowNodes: [attrs.node],
                        })
                      },
                    },
                    [m.trust(attrs.value ? truIcon : falseIcon)]
                  )
                },
              }),
            },
            {
              headerName: 'Stock',
              headerTooltip: 'Number of items currently owned',
              valueGetter: ({ data }) => {
                return this.nw.itemPref.get(field(data, 'HouseItemID'))?.stock
              },
              valueSetter: ({ data, newValue }) => {
                this.nw.itemPref.merge(field(data, 'HouseItemID'), {
                  stock: Number(newValue) || null,
                })
                return true
              },
              editable: true,
              width: 90,
            },
            {
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              valueGetter: ({ data }) => {
                return this.nw.itemPref.get(field(data, 'HouseItemID'))?.price
              },
              valueSetter: ({ data, newValue }) => {
                this.nw.itemPref.merge(field(data, 'HouseItemID'), {
                  price: Number(newValue) || null,
                })
                return true
              },
              editable: true,
              width: 90,
            },
          ],
        },
        {
          headerName: 'Placement',
          field: fieldName('HousingTag1 Placed'),
          filter: CategoryFilter,
          width: 150,
        },
        {
          field: fieldName('UIHousingCategory'),
          filter: CategoryFilter,
          width: 150,
        },
        {
          headerName: 'Obtain',
          field: fieldName('HowToOptain (Primarily)'),
          filter: CategoryFilter,
          width: 150,
        },
        {
          field: fieldName('HousingTags'),
        },
      ],
    })
  }

  public entities: Observable<Housingitems[]> = defer(() => {
    return this.nw.db.housingItems.pipe(map((items) => items.filter((it) => !it.ExcludeFromGame)))
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
