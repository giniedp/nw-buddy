import { CommonModule, DecimalPipe } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { PropertyGridModule } from '~/ui/property-grid'
import { TooltipModule } from '~/ui/tooltip'
import { BackstoryDetailStore } from './backstory-detail.store'

const BACKGROUND_IMAGES = {
  Faction1: 'url(assets/backstories/backstory_image_marauders.png)',
  Faction2: 'url(assets/backstories/backstory_image_covenant.png)',
  Faction3: 'url(assets/backstories/backstory_image_syndicate.png)',
  Default: 'url(assets/backstories/backstory_image_level.png)',
}

@Component({
  selector: 'nwb-backstory-detail',
  templateUrl: './backstory-detail.component.html',
  exportAs: 'detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    ItemFrameModule,
    PropertyGridModule,
    TooltipModule,
    IconsModule,
    // BackstoryLootTreeComponent,
  ],
  providers: [DecimalPipe, BackstoryDetailStore],
  host: {
    class: 'block rounded-md overflow-clip',
  },
})
export class BackstoryDetailComponent {
  protected store = inject(BackstoryDetailStore)
  public backstoryId = input<string>(null)

  #fxLoad = effect(() => {
    const backstoryId = this.backstoryId()
    untracked(() => this.store.load(backstoryId))
  })

  public backstory = this.store.backstory
  public backgroundImage = computed(() => {
    return BACKGROUND_IMAGES[this.backstory()?.FactionOverride] || BACKGROUND_IMAGES.Default
  })
  public inventoryItems = this.store.inventory
}
