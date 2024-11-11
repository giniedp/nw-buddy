import { CommonModule } from '@angular/common'
import { Component, computed, input, signal } from '@angular/core'
import { PerkType } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { apiResource } from '~/utils'
import { PerkBucketDetailPerksComponent } from './perk-bucket-detail.component'

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
    class: 'block',
  },
})
export class PerkBucketDetailTabsComponent {
  private db = injectNwData()

  public perkBucketIds = input<string[]>([])
  public itemId = input<string>(null)

  protected resource = apiResource({
    request: () => this.perkBucketIds(),
    loader: async ({ request }) => {
      if (!request?.length) {
        return []
      }
      const bucketMap = await this.db.perkBucketsByIdMap()
      const buckets = request.map((id) => bucketMap.get(id))
      return buckets
    },
  })

  public tabId = signal<string>(null)
  public tabs = computed(() => {
    const buckets = this.resource.value() || []
    return buckets.map((it, index): Tab => {
      return {
        id: String(index),
        bucketId: it.PerkBucketID,
        label: getPerkTypeLabel(it.PerkType),
        chance: it.PerkChance,
      }
    })
  })
  public tab = computed(() => {
    const tabId = this.tabId()
    const tabs = this.tabs()
    return tabs.find((it) => it.id === tabId) || tabs[0]
  })
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
