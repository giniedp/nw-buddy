import { Injectable } from '@angular/core'
import { Housingitems } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import m from 'mithril'
import { defer, map, Observable, of, shareReplay } from 'rxjs'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl, NwService } from '~/nw'
import { getItemIconPath, getItemId, getItemRarity, getItemTierAsRoman } from '~/nw/utils'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { humanize } from '~/utils'
import { ItemMarkerCell, ItemTrackerCell, ItemTrackerFilter } from '~/widgets/item-tracker'
import { BookmarkCell, TrackingCell } from './components'

@Injectable()
export class HousingTableAdapter extends DataTableAdapter<Housingitems> {
  public entityID(item: Housingitems): string {
    return item.HouseItemID
  }

  public entityCategory(item: Housingitems): string {
    return item.UIHousingCategory
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 54,
          pinned: true,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              target: '_blank',
              href: nwdbLinkUrl('item', getItemId(data)),
              rarity: getItemRarity(data),
              icon: getItemIconPath(data),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1']
            })
          }),
        },
        {
          width: 300,
          headerName: 'Name',
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Name)),
          getQuickFilterText: ({ value }) => value,
        },
        {
          field: this.fieldName('HouseItemID'),
          hide: true,
        },
        {
          width: 100,
          headerName: 'Rarity',
          field: this.fieldName('ItemRarity'),
          filter: SelectboxFilter,
        },
        {
          width: 80,
          field: this.fieldName('Tier'),
          filter: SelectboxFilter,
          valueGetter: ({ data }) => getItemTierAsRoman(data.Tier),
        },
        {
          headerName: 'User Data',
          children: [
            {
              width: 100,
              headerName: 'Bookmark',
              cellClass: 'cursor-pointer',
              filter: ItemTrackerFilter,
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.HouseItemID)?.mark || 0),
              cellRenderer: BookmarkCell,
              cellRendererParams: BookmarkCell.params({
                getId: (value: Housingitems) => getItemId(value),
                pref: this.nw.itemPref
              }),
            },
            {
              headerName: 'Owned',
              headerTooltip: 'Number of items currently owned',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.HouseItemID)?.stock),
              cellRenderer: TrackingCell,
              cellRendererParams: TrackingCell.params({
                getId: (value: Housingitems) => getItemId(value),
                pref: this.nw.itemPref,
                mode: 'stock',
                class: 'text-right',
              }),
              width: 90,
            },
            {
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              cellClass: 'text-right',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.HouseItemID)?.price),
              cellRenderer: TrackingCell,
              cellRendererParams: TrackingCell.params({
                getId: (value: Housingitems) => getItemId(value),
                pref: this.nw.itemPref,
                mode: 'price',
                formatter: this.moneyFormatter,
              }),
              width: 100,
            },
          ],
        },
        {
          headerName: 'Placement',
          field: this.fieldName('HousingTag1 Placed'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          width: 150,
        },
        {
          field: this.fieldName('UIHousingCategory'),
          filter: SelectboxFilter,
          width: 150,
        },
        {
          headerName: 'Obtain',
          field: this.fieldName('HowToOptain (Primarily)'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          width: 150,
        },
        {
          width: 250,
          field: this.fieldName('HousingTags'),
          valueGetter: ({ data, colDef }) => {
            return (data[colDef.field] || '').trim().split('+')
          },
          cellRenderer: this.cellRendererTags(humanize),
          filter: SelectboxFilter,
          filterParams: SelectboxFilter.params({
            showSearch: true,
            showCondition: true,
          }),
        },
      ],
    })
  )

  public entities: Observable<Housingitems[]> = defer(() => {
    return this.nw.db.housingItems.pipe(map((items) => items.filter((it) => !it.ExcludeFromGame)))
  }).pipe(
    shareReplay({
      refCount: true,
      bufferSize: 1,
    })
  )

  public constructor(private nw: NwService, private i18n: TranslateService) {
    super()
  }
}
