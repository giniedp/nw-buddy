import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwIconComponent, NwImageComponent } from './nw-icon.component'
import { NwInfoLinkDirective } from './nw-info-link.directive'
import { NwTextDirective } from './nw-text.directive'
import { NwTextPipe } from './nw-text.pipe'

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [
    NwTextDirective,
    NwIconComponent,
    NwImageComponent,
    NwInfoLinkDirective,
    NwTextPipe
  ],
  exports: [
    NwTextDirective,
    NwIconComponent,
    NwImageComponent,
    NwInfoLinkDirective,
    NwTextPipe,
  ],
})
export class NwModule {

}
