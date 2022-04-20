import { Injectable } from '@angular/core'
import { groupBy } from 'lodash'
import { combineLatest, defer, map, shareReplay } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'
import { ArmorsetGroup } from './types'
import { findSets } from './utils'

const MIN_RARITY = 2

@Injectable({ providedIn: 'root' })
export class ArmorsetsService {

  public all = defer(() => {
    return combineLatest({
      items: this.nw.db.items,
      perks: this.nw.db.perksMap,
      locale: this.locale.change,
    })
  })
    .pipe(
      map(({ items, perks }) => {
        items = items.filter((it) => it.ItemType === 'Armor').filter((it) => this.nw.itemRarity(it) >= MIN_RARITY)
        return Object.entries(groupBy(items, (it) => it['$source']))
          .map(([key, items]) => ({
            key: key,
            sets: findSets(items, perks, this.nw),
          }))
          .filter((group) => group.sets.length > 0)
          .reduce<Record<string, ArmorsetGroup[]>>((res, item) => {
            res[item.key] = item.sets
            return res
          }, {})
      })
    )
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      })
    )

  public filter = defer(() => this.all)
    .pipe(map((sets) => Object.keys(sets)))
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      })
    )

  public constructor(private nw: NwService, private locale: LocaleService) {
    //
  }
}
