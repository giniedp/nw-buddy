import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { environment } from '../environments/environment'
import { LayoutModule } from './ui/layout'
import { TooltipModule } from './ui/tooltip'

@Component({
  selector: 'nwb-privacy',
  templateUrl: './privacy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, TooltipModule, LayoutModule],
  host: {
    class: 'ion-page',
  },
})
export class PrivacyComponent {
  protected isWeb = environment.environment === 'WEB'
  protected hasPosthog = !!environment.posthogKey
}
