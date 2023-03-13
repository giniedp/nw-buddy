import { NgModule } from '@angular/core'
import { ChipsInputPaneComponent } from './chips-input-pane.component'
import { ChipsInputComponent } from './chips-input.component'

@NgModule({
  imports: [ChipsInputComponent, ChipsInputPaneComponent],
  exports: [ChipsInputComponent, ChipsInputPaneComponent],
})
export class ChipsInputModule {
  //
}
