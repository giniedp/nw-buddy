import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'

import { PreferencesRoutingModule } from './preferences-routing.module'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'

@NgModule({
  imports: [CommonModule, PreferencesRoutingModule, FormsModule, NwModule],
  declarations: [],
})
export class PreferencesModule {}
