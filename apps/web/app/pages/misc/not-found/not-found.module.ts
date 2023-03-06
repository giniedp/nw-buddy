import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { NwModule } from '~/nw'

import { NotFoundRoutingModule } from './not-found-routing.module'
import { NotFoundComponent } from './not-found.component'

@NgModule({
  declarations: [NotFoundComponent],
  imports: [CommonModule, NotFoundRoutingModule, NwModule],
})
export class NotFoundModule {}
