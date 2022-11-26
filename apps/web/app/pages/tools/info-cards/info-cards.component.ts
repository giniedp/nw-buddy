import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-info-cards-page',
  templateUrl: './info-cards.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ScreenshotModule, NavToolbarModule, IonicModule],
  host: {
    class: 'layout-col',
  }
})
export class InfoCardsComponent {

}
