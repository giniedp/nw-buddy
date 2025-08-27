import { CommonModule } from '@angular/common'
import { Component, computed, inject, input, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { PerkType } from '@nw-data/generated'
import { NwModule } from '../../../nw'
import { IconsModule } from '../../../ui/icons'
import { svgCheckToSlot, svgGears, svgSquare } from '../../../ui/icons/svg'
import { ItemFrameModule } from '../../../ui/item-frame'
import { PerkDetailModule } from '../perk-detail'
import { PerkBucketDetailStore } from './perk-bucket-detail.store'

export interface Tab {
  id: string
  bucketId: string
  label: string
  chance: number
}

@Component({
  selector: 'nwb-perk-bucket-detail',
  templateUrl: './perk-bucket-detail.component.html',
  imports: [CommonModule, NwModule, PerkDetailModule, RouterModule, ItemFrameModule, IconsModule],
  providers: [PerkBucketDetailStore],
  host: {
    class: 'block',
  },
})
export class PerkBucketDetailComponent {
  protected store = inject(PerkBucketDetailStore)
  protected checkedIcon = svgCheckToSlot
  protected uncheckedIcon = svgSquare
  protected settingsIcon = svgGears

  protected showSettings = signal(false)
  public perkBucketIds = input<string[]>([])
  public itemId = input<string>(null)

  public constructor() {
    this.store.connectItemId(toObservable(this.itemId))
  }

  public tabId = signal<string>(null)
  public tabs = computed(() => {
    return this.store.bucketTabs().map((it, index) => {
      return {
        key: it.key,
        locked: !!it.lockedPerkId,
        bucketId: it.bucket.PerkBucketID,
        label: getPerkTypeLabel(it.bucket.PerkType),
        chance: it.bucket.PerkChance,
        rows: it.rows,
      }
    })
  })

  public tab = computed(() => {
    const tabId = this.tabId()
    const tabs = this.tabs()
    return tabs.find((it) => it.key === tabId) || tabs[0]
  })

  protected setRolledPerk(key: string, perkId: string) {
    this.store.setRolledPerk(key, perkId)
  }
}

function getPerkTypeLabel(type: PerkType) {
  if (type === 'Generated') {
    return 'Perk'
  }
  if (type === 'Inherent') {
    return 'Attr'
  }
  return type
}
