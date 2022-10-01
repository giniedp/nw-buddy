import { Injectable } from '@angular/core'
import { Housingitems, ItemDefinitionMaster } from '@nw-data/types'
import { sortBy, uniqBy } from 'lodash'
import { combineLatest, map, Observable, of, switchMap } from 'rxjs'
import { NwDbService } from './nw-db.service'
import { getItemId, getItemRarity, LootTableEntry, LootTableItem } from './utils'

@Injectable({
  providedIn: 'root',
})
export class LoottableService {
  public constructor(private db: NwDbService) {
    //
  }

  public getTable(table: string) {
    return this.db.lootTable(table)
  }

  // public getTableItems(
  //   table: LootTableEntry,
  //   tags: Array<string | LootBucketTagValue>
  // ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
  //   if (!table) {
  //     return of([])
  //   }
  //   if (table.Conditions?.length && tags?.length) {
  //     if (!table.Conditions.some((it) => tags.some((el) => it === el))) {
  //       return of([])
  //     }
  //   }
  //   return combineLatest(table.Items.map((it) => this.fetchItems(it, tags)))
  //     .pipe(map((it) => it.flat(1)))
  //     .pipe(map((it) => uniqBy(it, (el) => getItemId(el))))
  //     .pipe(
  //       map((list) => {
  //         return sortBy(list, (it) => 5 - getItemRarity(it))
  //       })
  //     )
  // }

  // private fetchItems(
  //   item: LootTableItem,
  //   tags: Array<string | LootBucketTagValue>
  // ): Observable<Array<ItemDefinitionMaster | Housingitems>> {
  //   if (item.ItemID) {
  //     return combineLatest({
  //       items: this.db.itemsMap,
  //       housings: this.db.housingItemsMap,
  //     })
  //       .pipe(
  //         map(({ items, housings }) => {
  //           return items.get(item.ItemID) || housings.get(item.ItemID)
  //         })
  //       )
  //       .pipe(map((it) => (it ? [it] : [])))
  //   }
  //   if (item.LootBucketID) {
  //     return this.lbs
  //       .bucket(item.LootBucketID)
  //       .filter((entry) => this.lbs.matchContext(entry, tags || []))
  //       .items()
  //   }
  //   if (item.LootTableID) {
  //     return this.getTable(item.LootTableID).pipe(switchMap((table) => this.getTableItems(table, tags)))
  //   }
  //   return of([])
  // }
}
