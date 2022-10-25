import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NavToobalModule } from '~/ui/nav-toolbar'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-info-cards-page',
  templateUrl: './info-cards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ScreenshotModule, NavToobalModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  }
})
export class InfoCardsComponent {

}
