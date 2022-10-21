import { Injectable } from '@angular/core'
import { Housingitems } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, map, Observable, of, shareReplay, tap } from 'rxjs'
import { IconComponent, nwdbLinkUrl, NwService } from '~/nw'
import { SelectboxFilter, mithrilCell } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import m from 'mithril'
import { ItemMarkerCell, ItemTrackerCell, ItemTrackerFilter } from '~/widgets/item-tracker'
import { getItemIconPath, getItemRarity, getItemTierAsRoman } from '~/nw/utils'
import { TranslateService } from '~/i18n'
import { humanize } from '~/utils'

@Injectable()
export class HousingAdapterService extends DataTableAdapter<Housingitems> {
  public entityID(item: Housingitems): string {
    return item.HouseItemID
  }

  public entityCategory(item: Housingitems): string {
    return item.UIHousingCategory
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      columnDefs: [
        {
          sortable: false,
          filter: false,
          width: 54,
          pinned: true,
          cellRenderer: this.mithrilCell({
            view: ({ attrs: { data } }) =>
              m('a', { target: '_blank', href: nwdbLinkUrl('item', data.HouseItemID) }, [
                m(IconComponent, {
                  src: getItemIconPath(data),
                  class: `w-9 h-9 nw-icon bg-rarity-${getItemRarity(data)}`,
                }),
              ]),
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
              filter: ItemTrackerFilter,
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.HouseItemID)?.mark || 0),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemMarkerCell, {
                    itemId: data.HouseItemID,
                    meta: this.nw.itemPref,
                  })
                },
              }),
            },
            {
              headerName: 'Owned',
              headerTooltip: 'Number of items currently owned',
              cellClass: 'text-right',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.HouseItemID)?.stock),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemTrackerCell, {
                    class: 'text-right',
                    itemId: data.HouseItemID,
                    meta: this.nw.itemPref,
                    mode: 'stock',
                  })
                },
              }),
              width: 90,
            },
            {
              headerName: 'Price',
              headerTooltip: 'Current price in Trading post',
              cellClass: 'text-right',
              valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.HouseItemID)?.price),
              cellRenderer: this.mithrilCell({
                view: ({ attrs: { data } }) => {
                  return m(ItemTrackerCell, {
                    class: 'text-right',
                    itemId: data.HouseItemID,
                    meta: this.nw.itemPref,
                    mode: 'price',
                    formatter: this.moneyFormatter,
                  })
                },
              }),
              width: 90,
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
