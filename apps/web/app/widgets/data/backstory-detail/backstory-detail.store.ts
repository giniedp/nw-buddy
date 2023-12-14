import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { buildBackstoryItemInstance, getBackstoryItems } from '@nw-data/common'
import { NwDbService } from '~/nw'
import { selectStream } from '~/utils'
import { selectBackstoryTradeSkills } from './selectors'

@Injectable()
export class BackstoryDetailStore extends ComponentStore<{ backstoryId: string }> {
  protected db = inject(NwDbService)
  public readonly backstoryId$ = this.select(({ backstoryId }) => backstoryId)

  @Output()
  public readonly backstory$ = selectStream(this.db.backstory(this.backstoryId$))

  public readonly tradeSkills$ = this.select(this.backstory$, selectBackstoryTradeSkills)
  public readonly inventoryItems$ = selectStream(
    {
      backstory: this.backstory$,
      itemsMap: this.db.itemsMap,
      housingMap: this.db.housingItemsMap,
      territoriesMap: this.db.territoriesMap,
      perksMap: this.db.perksMap,
      bucketsMap: this.db.perkBucketsMap,
    },
    ({ backstory, itemsMap, housingMap, perksMap, bucketsMap }) => {
      if (!backstory) {
        return []
      }
      return getBackstoryItems(backstory).map((it) => {
        const item = itemsMap.get(it.itemId) || housingMap.get(it.itemId)
        const instance = buildBackstoryItemInstance(it, {
          itemsMap,
          housingMap,
          perksMap,
          bucketsMap,
        })
        return {
          ...instance,
          item,
        }
      })
    },
  )

  public constructor() {
    super({ backstoryId: null })
  }
}
