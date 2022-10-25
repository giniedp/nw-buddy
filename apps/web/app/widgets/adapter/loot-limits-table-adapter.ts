import { Injectable, Optional } from '@angular/core'
import { Housingitems, ItemDefinitionMaster, Lootlimits, Perks } from '@nw-data/types'
import { GridOptions } from 'ag-grid-community'
import { addSeconds, formatDistance, formatDistanceStrict, formatDuration } from 'date-fns'
import m from 'mithril'
import { combineLatest, defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { nwdbLinkUrl, NwService } from '~/nw'
import { getItemIconPath, getItemId, getItemPerkBucketIds, getItemPerks, getItemRarity, getItemRarityName, getItemTierAsRoman } from '~/nw/utils'
import { AgGridComponent, RangeFilter, SelectboxFilter } from '~/ui/ag-grid'
import { DataTableAdapter } from '~/ui/data-table'
import { humanize, shareReplayRefCount } from '~/utils'
import { ItemMarkerCell, ItemTrackerCell, ItemTrackerFilter } from '~/widgets/item-tracker'
import { BookmarkCell, TrackingCell } from './components'

export type TableItem = Lootlimits & {
  $item: ItemDefinitionMaster | Housingitems
}

@Injectable()
export class LootLimitsTableAdapter extends DataTableAdapter<TableItem> {
  public static provider() {
    const provider = []
    provider.push(DataTableAdapter.provideClass(LootLimitsTableAdapter))
    return provider
  }

  public entityID(item: TableItem): string {
    return item.LootLimitID
  }

  public entityCategory(item: TableItem): string {
    return null
  }

  public options = defer(() =>
    of<GridOptions>({
      rowSelection: 'single',
      rowBuffer: 0,
      // suppressRowHoverHighlight: true,
      columnDefs: [
        this.colDef({
          colId: 'icon',
          headerValueGetter: () => 'Icon',
          resizable: false,
          sortable: false,
          filter: false,
          pinned: true,
          width: 54,
          cellRenderer: this.cellRenderer(({ data }) => {
            if (!data.$item) {
              return null
            }
            return this.createLinkWithIcon({
              href: nwdbLinkUrl('item', getItemId(data.$item)),
              target: '_blank',
              icon: getItemIconPath(data.$item),
              rarity: getItemRarity(data.$item),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1']
            })
          })
        }),
        this.colDef({
          colId: 'name',
          headerValueGetter: () => 'Name',
          width: 200,
          valueGetter: this.valueGetter(({ data }) => {
            return data.$item ? this.i18n.get(data.$item?.Name) : data.LootLimitID
          }),
          getQuickFilterText: ({ value }) => value,
        }),
        this.colDef({
          colId: 'countLimit',
          headerValueGetter: () => 'Count Limit',
          field: this.fieldName('CountLimit'),
          width: 130,
        }),
        this.colDef({
          colId: 'timeBetweenDrops',
          headerValueGetter: () => 'Time Between Drops',
          valueGetter: this.valueGetter(({ data }) => {
            return [data.MinLimitSeconds, data.MaxLimitSeconds]
          }),
          valueFormatter: ({ value }) => {
            return (value as Number[]).filter((it) => !!it).map((it: number) => {
              const now = new Date()
              const then = addSeconds(now, it)
              return formatDistanceStrict(now, then)
            }).join(' - ')
          },
          width: 130,
        }),
        this.colDef({
          colId: 'limitExpiresAfter',
          headerValueGetter: () => 'Cooldown',
          field: this.fieldName('LimitExpireSeconds'),
          valueFormatter: ({ value }) => {
            const now = new Date()
            const then = addSeconds(now, value)
            return formatDistanceStrict(now, then)
          },
          width: 130,
        }),
      ],
    }
  ))

  public entities: Observable<TableItem[]> = defer(() => {
    return combineLatest({
      items: this.nw.db.itemsMap,
      housing: this.nw.db.housingItemsMap,
      limits: this.nw.db.lootLimits
    })
      .pipe(map(({ items, housing, limits }) => {
        return limits.map((it): TableItem => {
          return {
            ...it,
            $item: items.get(it.LootLimitID) || housing.get(it.LootLimitID)
          }
        })
      }))
  }).pipe(
    shareReplayRefCount(1)
  )

  public constructor(
    private nw: NwService,
    private i18n: TranslateService,
  ) {
    super()
  }
}
