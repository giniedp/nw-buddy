import { NgModule } from '@angular/core'
import { PerkDetailComponent } from './perk-detail.component'
import { PerkDetailDirective } from './perk-detail.directive'

const components = [PerkDetailComponent, PerkDetailDirective]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class PerkDetailModule {
  //
}
