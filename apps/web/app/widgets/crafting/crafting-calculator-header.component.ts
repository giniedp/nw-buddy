import { Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgDollarSign, svgGears, svgPercent } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { CraftingCalculatorStore } from './crafting-calculator.store'
import { CraftingChanceMenuComponent } from './crafting-bonus'
import { PriceImporterModule } from '../price-importer/price-importer.module'

@Component({
  selector: 'nwb-crafting-calculator-header',
  templateUrl: './crafting-calculator-header.component.html',
  imports: [
    FormsModule,
    NwModule,
    TooltipModule,
    IconsModule,
    LayoutModule,
    CraftingChanceMenuComponent,
    PriceImporterModule,
  ],
  host: {
    class: 'flex flex-row items-center',
  },
})
export class CraftingCalculatorHeaderComponent {
  protected store = inject(CraftingCalculatorStore)
  protected skill = this.store.tradeskill
  protected recipeLevel = computed(() => this.store.recipe()?.RecipeLevel)
  protected skillLevel = this.store.tradeskillLevel
  protected canCraft = this.store.canCraft

  protected iconImporter = svgDollarSign
  protected iconMode = svgPercent
  protected iconOptions = svgGears
}
