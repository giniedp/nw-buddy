import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { getItemIconPath, getItemId, getItemRarity } from '@nw-data/common'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { apiResource } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ItemTrackerModule } from '~/widgets/item-tracker'
import { CraftingStepToggleComponent } from '../crafting-step-toggle'
import { CraftingPerkSlot } from '../loader/load-recipe'
import { AmountMode } from '../types'

@Component({
  selector: 'nwb-crafting-slot',
  templateUrl: './crafting-slot.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    ItemTrackerModule,
    CdkMenuModule,
    ItemDetailModule,
    TooltipModule,
    ItemFrameModule,
    RouterModule,
    CraftingStepToggleComponent,
  ],
  providers: [],
})
export class CraftingSlotComponent {
  private db = injectNwData()
  public slot = input<CraftingPerkSlot>(null)
  public amount = input<number>(1)
  public amountMode = input<AmountMode>('net')
  public pickClicked = output()

  private itemResource = apiResource({
    request: () => this.slot()?.modItemId,
    loader: async ({ request }) => this.db.itemsById(request),
  })
  private item = computed(() => this.itemResource.value())
  protected itemId = computed(() => getItemId(this.item()))
  protected itemIcon = computed(() => getItemIconPath(this.item()))
  protected itemRarity = computed(() => getItemRarity(this.item()))
  protected itemName = computed(() => this.item()?.Name)
  protected typeLabel = computed(() => {
    if (this.slot()?.bucketType === 'Inherent') {
      return 'crafting_specialattributetitle'
    }
    return 'crafting_specialadded'
  })
}
