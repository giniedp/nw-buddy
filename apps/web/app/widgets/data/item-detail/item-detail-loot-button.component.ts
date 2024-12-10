import { Component, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgSquareArrowUpRight } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { LootGraphComponent } from '~/widgets/loot/loot-graph.component'
import { ItemDetailStore } from './item-detail.store'

@Component({
  standalone: true,
  selector: `nwb-item-detail-loot-button`,
  template: `
    @if (salvage(); as info) {
      <button
        class="btn btn-xs flex-1 btn-outline btn-ghost rounded-md opacity-50"
        [nwbModalOpen]="{ content: tplDialog, size: 'md' }"
      >
        Show Loot Table
      </button>
      <a
        class="btn btn-xs flex-none btn-outline btn-ghost rounded-md opacity-50"
        [routerLink]="['loot', salvage()?.tableId] | nwLink"
      >
        <nwb-icon [icon]="iconLink" class="w-4 h-4" />
      </a>

      <ng-template #tplDialog>
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
            class="flex-1 layout-content"
            [tableId]="info.tableId"
            [tags]="info.tags"
            [tagValues]="info.tagValues"
            [showLocked]="false"
          />
        </ion-content>
      </ng-template>
    }
  `,
  imports: [NwModule, RouterModule, IconsModule, LootGraphComponent, LayoutModule],
  host: {
    '[class.hidden]': '!salvage()',
  },
})
export class ItemDetailLootButtonComponent {
  private store = inject(ItemDetailStore)
  protected salvage = this.store.salvageInfo
  protected iconLink = svgSquareArrowUpRight
}
