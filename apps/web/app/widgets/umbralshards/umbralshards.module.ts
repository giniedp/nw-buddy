import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { AgGridModule } from '~/ui/ag-grid'
import { UmbralTableComponent } from './umbral-table.component'
import { UmbralCalculatorComponent } from './umbral-calculator.component'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { UmbralCalculatorStepsComponent } from './umbral-calculator-steps.component'

@NgModule({
  imports: [CommonModule, AgGridModule, FormsModule, NwModule],
  declarations: [UmbralTableComponent, UmbralCalculatorComponent, UmbralCalculatorStepsComponent],
  exports: [UmbralTableComponent, UmbralCalculatorComponent, UmbralCalculatorStepsComponent],
})
export class UmbralshardsModule {}
