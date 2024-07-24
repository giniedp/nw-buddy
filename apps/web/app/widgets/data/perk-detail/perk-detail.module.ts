import { NgModule } from '@angular/core'
import { PerkDetailComponent } from './perk-detail.component'
import { PerkDetailDirective } from './perk-detail.directive'
import { PerkDetailDescriptionComponent } from './perk-detail-description.component'
import { PerkDetailHeaderComponent } from './perk-detail-header.component'
import { PerkDetailModsComponent } from './perk-detail-mods.component'
import { PerkDetailPropertiesComponent } from './perk-detail-properties.component'

const components = [
  PerkDetailComponent,
  PerkDetailDirective,
  PerkDetailDescriptionComponent,
  PerkDetailHeaderComponent,
  PerkDetailModsComponent,
  PerkDetailPropertiesComponent,
]
@NgModule({
  imports: [...components],
  exports: [...components],
})
export class PerkDetailModule {
  //
}
