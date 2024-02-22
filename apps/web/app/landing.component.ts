import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { environment } from '../environments/environment'
import { TooltipModule } from './ui/tooltip'
import { LayoutModule } from './ui/layout'

@Component({
  standalone: true,
  selector: 'nwb-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, LayoutModule],
  host: {
    class: 'ion-page',
  },
})
export class LandingComponent {
  protected isWeb = environment.environment === 'WEB'
}
