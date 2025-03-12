import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NwModule } from '~/nw'
import { environment } from '../environments/environment'
import { TooltipModule } from './ui/tooltip'

@Component({
  selector: 'nwb-privacy',
  templateUrl: './privacy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule],
  host: {
    class: 'layout-content w-full layout-pad',
  },
})
export class PrivacyComponent {
  protected isWeb = environment.environment === 'WEB'
  public constructor() {
    //
  }
}
