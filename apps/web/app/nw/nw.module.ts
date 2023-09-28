import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { GamingtoolsLinkDirective } from './nw-gaming-tools-link.directive'
import { NwHumanizePipe } from './nw-humanize.pipe'
import { NwIconComponent, NwImageComponent } from './nw-icon.component'
import { NwLinkDirective } from './nw-link.directive'
import { NwTextDirective } from './nw-text.directive'
import { NwTextBreakPipe, NwTextPipe } from './nw-text.pipe'
import { NwHtmlDirective } from './nw-html.directive'
import { NwNoHtmlPipe } from './no-html.pipe'

const COMPONENTS = [
  GamingtoolsLinkDirective,
  NwHtmlDirective,
  NwHumanizePipe,
  NwIconComponent,
  NwImageComponent,
  NwLinkDirective,
  NwTextBreakPipe,
  NwTextDirective,
  NwTextPipe,
  NwNoHtmlPipe,
]
@NgModule({
  imports: [CommonModule, FormsModule, ...COMPONENTS],
  exports: [...COMPONENTS],
})
export class NwModule {
  //
}
