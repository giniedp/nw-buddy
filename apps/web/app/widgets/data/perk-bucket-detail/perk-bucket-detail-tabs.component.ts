import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { PerkBucketDetailPerksComponent } from './perk-bucket-detail.component'
import { PerkType } from '@nw-data/types'

export interface Tab {
  id: string
  bucketId: string
  label: string
  chance: number
}

@Component({
  standalone: true,
  selector: 'nwb-perk-bucket-detail-tabs',
  templateUrl: './perk-bucket-detail-tabs.component.html',
  imports: [CommonModule, PerkBucketDetailPerksComponent],
  host: {
    class: 'block'
  }
})
export class PerkBucketDetailTabsComponent extends ComponentStore<{
  perkBucketIds: string[]
  itemId: string
  tabId: string
}> {
  @Input()
  public set perkBucketIds(value: string[]) {
    this.patchState({ perkBucketIds: value })
  }

  @Input()
  public set itemId(value: string) {
    this.patchState({ itemId: value })
  }
  protected ids$ = this.select(({ perkBucketIds }) => perkBucketIds)
  protected buckets$ = combineLatest({
    buckets: this.db.perkBucketsMap,
    ids: this.ids$,
  }).pipe(map(({ ids, buckets }) => ids.map((id) => buckets.get(id))))

  protected tabs$ = this.select(this.buckets$, (buckets) => {
    return buckets.map((it, index): Tab => {
      return {
        id: String(index),
        bucketId: it.PerkBucketID,
        label: getPerkTypeLabel(it.PerkType),
        chance: it.PerkChance
      }
    })
  })

  protected tab$ = combineLatest({
    tabId: this.select((it) => it.tabId),
    tabs: this.tabs$
  }).pipe(map(({ tabId, tabs }) => tabs.find((it) => it.id === tabId) || tabs[0]))

  protected vm$ = combineLatest({
    itemId: this.select((it) => it.itemId),
    tab: this.tab$,
    tabs: this.tabs$
  })

  public constructor(private db: NwDbService) {
    super({
      perkBucketIds: null,
      tabId: null,
      itemId: null,
    })
  }
}

function getPerkTypeLabel(type: PerkType) {
  if (type ==='Generated') {
    return 'Perk'
  }
  if (type === 'Inherent') {
    return 'Attribute'
  }
  return type
}
