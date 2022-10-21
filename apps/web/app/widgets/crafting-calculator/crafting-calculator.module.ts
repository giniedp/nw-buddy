import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { TradeskillsModule } from '../tradeskills'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
import { CraftingStepComponent } from './crafting-step.component';
import { CraftingSummaryComponent } from './crafting-summary.component';
import { CraftingStepToggleComponent } from './crafting-step-toggle.component'
import { ItemTrackerModule } from '../item-tracker'
import { PriceImporterModule } from '../price-importer/price-importer.module'

@NgModule({
  imports: [CommonModule, NwModule, FormsModule, TradeskillsModule, ItemTrackerModule, PriceImporterModule],
  declarations: [CraftingCalculatorComponent, CraftingStepComponent, CraftingSummaryComponent, CraftingStepToggleComponent],
  exports: [CraftingCalculatorComponent],
})
export class CraftingCalculatorModule {}
