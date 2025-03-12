import { Component, inject, computed } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { NwTextContextService } from '~/nw/expression'
import { GsInputComponent } from '~/ui/gs-input'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { PerkDetailStore } from './perk-detail.store'

@Component({
  selector: 'nwb-perk-detail-header',
  template: `
    <nwb-item-header class="gap-2">
      <a [nwbItemIcon]="icon()" [nwLinkTooltip]="['perk', perkId()]" class="w-[76px] h-[76px]"> </a>
      <nwb-item-header-content
        class="z-10"
        [title]="(name() | nwText | nwTextBreak: ' - ') || (perkId() | nwHumanize)"
        [text1]="'perk'"
        [text2]="type()"
        [showSkeleton]="showSkeleton()"
      >
        @if (store.isLoaded() && !store.perk()) {
          <span header-text2 class="text-error">Not found</span>
        }
        @if (scalesWithGearScore()) {
          <div class="absolute right-1 bottom-1 flex flex-colr gap-1 items-center">
            <img [nwImage]="'assets/icons/item/icon_gearscore.png'" class="w-6 h-6" [tooltip]="'Selected Gear Score'" />
            <nwb-gs-input
              [size]="'xs'"
              [bordered]="true"
              [ghost]="true"
              [bars]="true"
              [values]="true"
              [ngModel]="context.gearScore$()"
              (ngModelChange)="context.patchState({ gearScore: $event })"
              class="w-20 text-right"
            />
          </div>
        }
      </nwb-item-header-content>
    </nwb-item-header>
  `,
  imports: [ItemFrameModule, NwModule, TooltipModule, GsInputComponent, FormsModule],
  host: {
    class: 'block',
  },
})
export class PerkDetailHeaderComponent {
  protected store = inject(PerkDetailStore)
  protected perkId = this.store.perkId
  protected icon = this.store.icon
  protected name = this.store.name
  protected type = this.store.type
  protected scalesWithGearScore = this.store.scalesWithGearScore
  protected readonly context = inject(NwTextContextService)

  protected showSkeleton = computed(() => this.store.isLoading() && !this.store.isLoaded())
}
