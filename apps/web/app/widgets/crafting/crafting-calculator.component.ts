import { CdkMenuModule } from '@angular/cdk/menu'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, effect, inject, input, signal, untracked } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CraftingRecipeData } from '@nw-data/generated'
import { switchMap, take } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { pickPerkForItem } from '../data/perk-table'
import { PriceImporterModule } from '../price-importer/price-importer.module'
import { CraftingCalculatorHeaderComponent } from './crafting-calculator-header.component'
import { CraftingCalculatorStore } from './crafting-calculator.store'
import { CraftingSlotComponent } from './crafting-slot'
import { CraftingStepComponent } from './crafting-step'
import { CraftingSummaryComponent } from './crafting-summary'
import { CraftingPerkSlot } from './loader/load-recipe'
import { AmountMode } from './types'

@Component({
  selector: 'nwb-crafting-calculator',
  templateUrl: './crafting-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    IconsModule,
    FormsModule,
    PriceImporterModule,
    TooltipModule,
    LayoutModule,
    CraftingStepComponent,
    OverlayModule,
    CraftingSummaryComponent,
    CdkMenuModule,
    CraftingSlotComponent,
    CraftingCalculatorHeaderComponent,
  ],
  providers: [CraftingCalculatorStore],
  host: {
    class: 'block',
  },
})
export class CraftingCalculatorComponent {
  private db = injectNwData()
  private injector = inject(Injector)
  protected store = inject(CraftingCalculatorStore)
  public amount = input<number>(1)
  public amountMode = input<AmountMode>('net')
  public recipeOnly = input<boolean>(false)
  public headClass = input<string | string[]>([])
  public entity = input<CraftingRecipeData | string>()

  public itemId = this.store.itemId
  public craftedPerks = this.store.craftedPerks
  public craftedGearScore = this.store.craftedGearScore

  public gearScoreInfo = this.store.gearScoreDetails
  public recipe = this.store.recipe

  protected totalCraft = signal<number>(1)
  #fxLoad = effect(() => {
    const entity = this.entity()
    const recipeId = typeof entity === 'string' ? entity : entity?.RecipeID
    untracked(() => this.store.load(recipeId))
  })

  #fxConfig = effect(() => {
    const amount = this.amount()
    const amountMode = this.amountMode()
    untracked(() => {
      this.store.updateAmount(amount)
      this.store.updateAmountMode(amountMode)
    })
  })

  protected pickCraftMod(slot: CraftingPerkSlot) {
    pickPerkForItem({
      db: this.db,
      injector: this.injector,
      slotKey: slot.bucketKey,
      craftOnly: true,
      record: this.store.itemInstance(),
    })
      .pipe(
        switchMap(async (perk) => {
          const perkId = perk?.PerkID
          const resources = await this.db.resourceItemsForPerkId(perkId)
          const itemId = resources?.[0]?.ResourceID
          return {
            perkId,
            itemId,
          }
        }),
      )
      .pipe(take(1))
      .subscribe(({ perkId, itemId }) => {
        this.store.updateSlot(slot, perkId, itemId)
      })
  }
}
