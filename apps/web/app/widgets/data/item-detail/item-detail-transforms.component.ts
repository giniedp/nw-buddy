import { Component, computed, HostBinding, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { apiResource } from '~/utils'
import { ItemDetailDirective } from './item-detail.directive'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-transforms',
  template: `
    @if (toItemId(); as itemId) {
      <div animate.enter="fade-grow-y-in" animate.leave="fade-grow-y-out">
        <h3 class="font-bold mb-1">Transforms to</h3>
        <div class="flex flex-row flex-wrap gap-2">
          <a
            [nwbItemDetail]="itemId"
            #detail="itemDetail"
            [nwbItemIcon]="detail.icon()"
            [rarity]="detail.rarity()"
            [isNamed]="detail.isNamed()"
            [solid]="true"
            [routerLink]="['item', itemId] | nwLink"
            class="w-full max-w-[42px] aspect-square outline-primary outline-offset-1 outline-1"
          >
          </a>
        </div>
      </div>
    }
    @if (fromItemIds(); as itemIds) {
      <div animate.enter="fade-grow-y-in" animate.leave="fade-grow-y-out">
        <h3 class="font-bold mb-1">Transforms from</h3>
        <div class="flex flex-row flex-wrap gap-2">
          @for (itemId of itemIds; track $index) {
            <a
              [nwbItemDetail]="itemId"
              #detail="itemDetail"
              [nwbItemIcon]="detail.icon()"
              [rarity]="detail.rarity()"
              [isNamed]="detail.isNamed()"
              [solid]="true"
              [routerLink]="['item', itemId] | nwLink"
              class="w-full max-w-[42px] aspect-square outline-primary outline-offset-1 outline-1"
            >
            </a>
          }
        </div>
      </div>
    }
  `,
  host: {
    class: 'block',
  },
  imports: [NwModule, ItemFrameModule, ItemDetailDirective, RouterModule],
})
export class ItemDetailTransformsComponent {
  private db = injectNwData()
  private store = inject(ItemDetailStore)
  private resource = apiResource({
    request: () => this.store.recordId(),
    loader: async ({ request }) => {
      return {
        to: await this.db.itemTransformsById(request).then((res) => res?.ToItemId),
        from: await this.db.itemTransformsByToItemId(request).then((res) => res?.map((it) => it?.FromItemId)),
      }
    },
  })
  protected toItemId = computed(() => this.resource.value()?.to)
  protected fromItemIds = computed(() => this.resource.value()?.from)

  protected isHidden = computed(() => {
    return !this.toItemId() && !this.fromItemIds()?.length
  })
}
