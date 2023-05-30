import { Injectable } from '@angular/core'
import { Housingitems, ItemDefinitionMaster, Lootlimits } from '@nw-data/generated'
import { GridOptions } from 'ag-grid-community'
import { addSeconds, formatDistanceStrict } from 'date-fns'
import { combineLatest, defer, map, Observable, of } from 'rxjs'
import { TranslateService } from '~/i18n'
import { NwDbService, NwLinkService } from '~/nw'
import { getItemIconPath, getItemId, getItemRarity } from '~/nw/utils'
import { NW_FALLBACK_ICON } from '~/nw/utils/constants'
import { DataTableAdapter, dataTableProvider } from '~/ui/data-table'
import { shareReplayRefCount } from '~/utils'

export type TableItem = Lootlimits & {
  $item: ItemDefinitionMaster | Housingitems
}

@Injectable()
export class LootLimitsTableAdapter extends DataTableAdapter<TableItem> {
  public static provider() {
    return dataTableProvider({
      adapter: LootLimitsTableAdapter,
    })
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
          width: 62,
          cellRenderer: this.cellRenderer(({ data }) => {
            if (!data.$item) {
              return null
            }
            return this.createLinkWithIcon({
              href: this.info.link('item', getItemId(data.$item)),
              target: '_blank',
              icon: getItemIconPath(data.$item) || NW_FALLBACK_ICON,
              rarity: getItemRarity(data.$item),
              iconClass: ['transition-all', 'translate-x-0', 'hover:translate-x-1'],
            })
          }),
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
            return (value as Number[])
              .filter((it) => !!it)
              .map((it: number) => {
                const now = new Date()
                const then = addSeconds(now, it)
                return formatDistanceStrict(now, then)
              })
              .join(' - ')
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
    })
  )

  public entities: Observable<TableItem[]> = defer(() => {
    return combineLatest({
      items: this.db.itemsMap,
      housing: this.db.housingItemsMap,
      limits: this.db.lootLimits,
    }).pipe(
      map(({ items, housing, limits }) => {
        return limits.map((it): TableItem => {
          return {
            ...it,
            $item: items.get(it.LootLimitID) || housing.get(it.LootLimitID),
          }
        })
      })
    )
  }).pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, private i18n: TranslateService, private info: NwLinkService) {
    super()
  }
}
