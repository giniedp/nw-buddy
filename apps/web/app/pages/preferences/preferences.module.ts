import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { PreferencesRoutingModule } from './preferences-routing.module'
import { PreferencesComponent } from './preferences.component'
import { FormsModule } from '@angular/forms'

@NgModule({
  imports: [CommonModule, PreferencesRoutingModule, FormsModule],
  declarations: [PreferencesComponent],
})
export class PreferencesModule {}
