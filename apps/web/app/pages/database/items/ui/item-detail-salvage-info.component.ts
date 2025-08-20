import { Component, computed, HostBinding, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgLink } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { ItemDetailStore } from '~/widgets/data/item-detail'
import { LootModule } from '~/widgets/loot'

@Component({
  selector: 'nwb-item-detail-salvage-info',
  template: `
    @if (salvageInfo(); as salvage) {
      <div class="join rounded-md w-full" animate.enter="fade-grow-y-in" animate.leave="fade-grow-y-out">
        <button
          class="join-item btn btn-xs flex-1 btn-outline btn-ghost rounded-md opacity-50"
          [nwbModalOpen]="{ content: tplSalvage, size: 'md' }"
        >
          Show Loot Table
        </button>
        <a
          class="join-item btn btn-xs flex-none btn-outline btn-ghost rounded-md opacity-50"
          [routerLink]="['loot', salvage.tableId] | nwLink"
        >
          <nwb-icon [icon]="iconLink" class="w-4 h-4" />
        </a>

        <ng-template #tplSalvage>
          <ion-header>
            <ion-toolbar class="ion-color ion-color-black border border-base-100 border-b-0 rounded-t-md">
              <ion-title>Loot Table</ion-title>
              <button type="button" slot="end" class="btn btn-ghost btn-circle mr-2 text-xl" [nwbModalClose]>
                &times;
              </button>
            </ion-toolbar>
          </ion-header>
          <ion-content [scrollY]="false" class="rounded-b-md bg-base-100">
            <nwb-loot-graph
              class="h-full overflow-auto"
              [tableId]="salvage.tableId"
              [tags]="salvage.tags"
              [tagValues]="salvage.tagValues"
              [showLocked]="false"
            />
          </ion-content>
        </ng-template>
      </div>
    }
  `,
  imports: [NwModule, LootModule, LayoutModule, RouterModule, IconsModule],
  host: {
    class: 'block',
  },
})
export class ItemDetailSalvageInfoComponent {
  private store = inject(ItemDetailStore)
  protected salvageInfo = this.store.salvageInfo
  protected iconLink = svgLink

  protected isHidden = computed(() => {
    return !this.salvageInfo()
  })
}
