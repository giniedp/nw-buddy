import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { NwModule } from '~/core/nw'
import { CraftCalculatorComponent } from './craft-calculator.component'

@NgModule({
  imports: [CommonModule, NwModule],
  declarations: [CraftCalculatorComponent],
  exports: [CraftCalculatorComponent],
})
export class CraftCalculatorModule {

}
