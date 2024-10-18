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
import { DataViewAdapter, DataViewCategory } from '~/ui/data/data-view'
import { TableGridUtils } from '~/ui/data/table-grid'
import { VirtualGridOptions } from '~/ui/data/virtual-grid'
import { TrackingCell } from '~/widgets/adapter/components'
import { NwmpPriceItem } from './types'

export class NwmpPriceTableAdapter implements DataViewAdapter<NwmpPriceItem> {
  private util: TableGridUtils<NwmpPriceItem> = inject(TableGridUtils)

  public entityID(item: NwmpPriceItem): string {
    return item.id.toLowerCase()
  }

  public entityCategories(item: NwmpPriceItem): DataViewCategory[] {
    return null
  }

  public getCategories(): DataViewCategory[] {
    return null
  }

  public connect(): Observable<NwmpPriceItem[]> {
    return this.entities
  }

  public gridOptions(): GridOptions<NwmpPriceItem> {
    return buildGridOptions(this.util)
  }

  public virtualOptions(): VirtualGridOptions<NwmpPriceItem> {
    // not supported
    return null
  }

  public entities = new BehaviorSubject<NwmpPriceItem[]>(null)
}

function buildGridOptions(util: TableGridUtils<NwmpPriceItem>): GridOptions<NwmpPriceItem> {
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
          const item: any = data.item
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
          getId: (value: NwmpPriceItem) => getItemId(value.item),
          pref: util.itemPref,
          mode: 'price',
          //formatter: util.moneyFormatter,
        }),
        width: 100,
      },
      {
        headerName: 'New Price',
        cellClass: 'text-right',
        valueGetter: util.valueGetter(({ data }) => data.price),
        //valueFormatter: ({ value }) => util.moneyFormatter.format(value),
        width: 100,
      },
    ],
  }
}
