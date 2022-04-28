import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { PreferencesRoutingModule } from './preferences-routing.module'
import { PreferencesComponent } from './preferences.component'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/core/nw'

@NgModule({
  imports: [CommonModule, PreferencesRoutingModule, FormsModule, NwModule],
  declarations: [PreferencesComponent],
})
export class PreferencesModule {}
