import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { DamageCalculatorPageComponent } from './damage-calculator-page.component'

const routes: Routes = [
  {
    path: '',
    component: DamageCalculatorPageComponent,
  },
]
@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class DamageCalculatorModule {
  //
}
