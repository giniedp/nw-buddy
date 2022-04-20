import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/core/nw'
import { CraftingCalculatorComponent } from './crafting-calculator.component'
import { CraftingStepComponent } from './crafting-step.component';
import { CraftingSummaryComponent } from './crafting-summary.component'

@NgModule({
  imports: [CommonModule, NwModule, FormsModule],
  declarations: [CraftingCalculatorComponent, CraftingStepComponent, CraftingSummaryComponent],
  exports: [CraftingCalculatorComponent],
})
export class CraftingCalculatorModule {}
