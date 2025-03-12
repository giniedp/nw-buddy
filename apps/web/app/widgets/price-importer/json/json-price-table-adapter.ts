import { GridOptions } from '@ag-grid-community/core'
import { inject } from '@angular/core'
import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemRarity,
  isItemArtifact,
  isItemNamed,
  isMasterItem,
} from '@nw-data/common'
import { BehaviorSubject, Observable } from 'rxjs'
import { TableGridUtils } from '~/ui/data/table-grid'
import { DataViewAdapter } from '~/ui/data/data-view'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { TrackingCell } from '~/widgets/adapter/components'
import { JsonPriceItem } from './types'

export class JsonPriceTableAdapter implements DataViewAdapter<JsonPriceItem> {
  private utils: TableGridUtils<JsonPriceItem> = inject(TableGridUtils)

  public entityID(item: JsonPriceItem): string {
    return item.id.toLowerCase()
  }

  public entityCategories(item: JsonPriceItem) {
    return null
  }

  public gridOptions(): GridOptions<JsonPriceItem> {
    return buildGridOptions(this.utils)
  }
  public virtualOptions(): VirtualGridOptions<JsonPriceItem> {
    return null
  }
  public connect(): Observable<JsonPriceItem[]> {
    return this.entities
  }

  public entities = new BehaviorSubject<JsonPriceItem[]>(null)
}

function buildGridOptions(util: TableGridUtils<JsonPriceItem>): GridOptions<JsonPriceItem> {
  return {
    rowSelection: 'single',
    rowBuffer: 0,
    columnDefs: [
      {
        sortable: false,
        filter: false,
        width: 62,
        pinned: true,
        cellRenderer: util.cellRenderer(({ data }) => {
          const item = data.item
          return util.elA(
            {
              attrs: {
                href: util.tipLink('item', getItemId(item)),
                target: '_blank',
              },
            },
            util.elItemIcon({
              class: ['transition-all translate-x-0 hover:translate-x-1'],
              icon: getItemIconPath(item) || NW_FALLBACK_ICON,
              isArtifact: isMasterItem(item) && isItemArtifact(item),
              isNamed: isMasterItem(item) && isItemNamed(item),
              rarity: getItemRarity(item),
            }),
          )
        }),
      },
      {
        width: 250,
        headerName: 'Name',
        valueGetter: util.valueGetter(({ data }) => util.i18n.get(data.item?.Name)),
        cellRenderer: util.lineBreaksRenderer(),
        cellClass: ['multiline-cell'],
        autoHeight: true,
        getQuickFilterText: ({ value }) => value,
      },
      {
        headerName: 'Old Price',
        headerTooltip: 'Current price in Trading post',
        cellClass: 'text-right',
        valueGetter: util.valueGetter(({ data }) => util.itemPref.get(getItemId(data.item))?.price),
        cellRenderer: TrackingCell,
        cellRendererParams: TrackingCell.params({
          getId: (value: JsonPriceItem) => getItemId(value.item),
          pref: util.itemPref,
          mode: 'price',
          //formatter: util.moneyFormatter,
        }),
        width: 100,
      },
      {
        headerName: 'New Price',
        cellClass: 'text-right',
        valueGetter: ({ data }) => data.price,
        //valueFormatter: ({ value }) => util.moneyFormatter.format(value),
        width: 100,
      },
      // {
      //   headerName: 'Object Data',
      //   children: keys.map((key) => {
      //     return {
      //       headerName: `${key}`,
      //       valueGetter: util.valueGetter(({ data }) => data.data?.[key]),
      //       width: 100,
      //     }
      //   }),
      // },
    ],
  }
}
