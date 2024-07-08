import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwNoHtmlPipe } from './no-html.pipe'
import { GamingtoolsLinkDirective } from './nw-gaming-tools-link.directive'
import { NwHtmlDirective } from './nw-html.directive'
import { NwHumanizePipe } from './nw-humanize.pipe'
import { NwIconComponent, NwImageComponent } from './nw-icon.component'
import { NwLinkTooltipDirective } from './nw-link-tooltip.directive'
import { NwLinkPipe } from './nw-link.pipe'
import { NwTextDirective } from './nw-text.directive'
import { NwTextBreakPipe, NwTextPipe } from './nw-text.pipe'

const COMPONENTS = [
  GamingtoolsLinkDirective,
  NwHtmlDirective,
  NwHumanizePipe,
  NwIconComponent,
  NwImageComponent,
  NwLinkTooltipDirective,
  NwTextBreakPipe,
  NwTextDirective,
  NwTextPipe,
  NwNoHtmlPipe,
  NwLinkPipe,
]
@NgModule({
  imports: [CommonModule, FormsModule, ...COMPONENTS],
  exports: [...COMPONENTS],
})
export class NwModule {
  //
}
