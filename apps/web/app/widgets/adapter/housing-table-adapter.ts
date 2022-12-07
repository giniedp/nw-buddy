import { Injectable } from '@angular/core'
import { Housingitems } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { defer, map, Observable, of, shareReplay } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwInfoLinkService, NwService } from '~/nw'
import {
  getItemIconPath,
  getItemId,
  getItemRarity,
  getItemRarityLabel,
  getItemTierAsRoman,
  getUIHousingCategoryLabel,
} from '~/nw/utils'
import { SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter, DataTableCategory, dataTableProvider } from '~/ui/data-table'
import { humanize } from '~/utils'
import { ItemTrackerFilter } from '~/widgets/item-tracker'
import { BookmarkCell, TrackingCell } from './components'

@Injectable()
export class HousingTableAdapter extends DataTableAdapter<Housingitems> {
  public static provider() {
    return dataTableProvider({
      adapter: HousingTableAdapter,
    })
  }

  public entityID(item: Housingitems): string {
    return item.HouseItemID
  }

  public entityCategory(item: Housingitems): DataTableCategory {
    if (!item.UIHousingCategory) {
      return null
    }
    return {
      value: item.UIHousingCategory,
      label: this.i18n.get(getUIHousingCategoryLabel(item.UIHousingCategory)),
      icon: '',
    }
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            return this.createLinkWithIcon({
              target: '_blank',
              href: this.info.link('item', getItemId(data)),
              rarity: getItemRarity(data),
              icon: getItemIconPath(data),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 300,
          valueGetter: this.valueGetter(({ data }) => this.i18n.get(data.Name)),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'houseItemId',
          headerValueGetter: () => 'Item ID',
          field: this.fieldName('HouseItemID'),
          hide: true,
        }),
        this.colDef({
          colId: 'rarity',
          headerValueGetter: () => 'Rarity',
          valueGetter: ({ data }) => String(getItemRarity(data)),
          valueFormatter: ({ value }) => this.i18n.get(getItemRarityLabel(value)),
          filter: SelectboxFilter,
          width: 130,
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'tier',
          headerValueGetter: () => 'Tier',
          width: 80,
          field: this.fieldName('Tier'),
          filter: SelectboxFilter,
          valueGetter: ({ data }) => getItemTierAsRoman(data.Tier),
        }),
        this.colDef({
          colId: 'userBookmark',
          headerValueGetter: () => 'Bookmark',
          width: 100,
          cellClass: 'cursor-pointer',
          filter: ItemTrackerFilter,
          valueGetter: this.valueGetter(({ data }) => this.nw.itemPref.get(data.HouseItemID)?.mark || 0),
          cellRenderer: BookmarkCell,
          cellRendererParams: BookmarkCell.params({
            getId: (value: Housingitems) => getItemId(value),
            pref: this.nw.itemPref,
          }),
        }),
        this.colDef({
          colId: 'userStockValue',
          headerValueGetter: () => 'In Stock',
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
        }),
        this.colDef({
          colId: 'userPrice',
          headerValueGetter: () => 'Price',
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
        }),
        this.colDef({
          colId: 'housingTag1Placed',
          headerValueGetter: () => 'Placement',
          headerName: 'Placement',
          field: this.fieldName('HousingTag1 Placed'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          width: 150,
        }),
        this.colDef({
          colId: 'uiHousingCategory',
          headerValueGetter: () => 'Housing Category',
          valueGetter: this.valueGetter(({ data }) => data.UIHousingCategory),
          valueFormatter: ({ value }) => this.i18n.get(getUIHousingCategoryLabel(value)),
          getQuickFilterText: ({ value }) => this.i18n.get(getUIHousingCategoryLabel(value)),
          filter: SelectboxFilter,
          width: 150,
        }),
        this.colDef({
          colId: 'howToObtain',
          headerValueGetter: () => 'Obtain',
          field: this.fieldName('HowToOptain (Primarily)'),
          valueFormatter: ({ value }) => humanize(value),
          filter: SelectboxFilter,
          width: 150,
        }),
        this.colDef({
          colId: 'housingTags',
          headerValueGetter: () => 'Housing Tags',
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
        }),
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

  public constructor(private nw: NwService, private i18n: TranslateService, private info: NwInfoLinkService) {
    super()
  }
}
