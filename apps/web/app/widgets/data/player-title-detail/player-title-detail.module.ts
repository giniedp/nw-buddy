import { NgModule } from '@angular/core'
import { PlayerTitleDetailComponent } from './player-title-detail.component'

const components = [PlayerTitleDetailComponent]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class PlayerTitleDetailModule {
  //
}
