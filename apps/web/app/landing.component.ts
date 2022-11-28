import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NwModule } from '~/nw'
import { environment } from '../environments/environment'
import { TooltipModule } from './ui/tooltip'

@Component({
  standalone: true,
  selector: 'nwb-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule],
  host: {
    class: 'layout-content w-full layout-pad',
  },
})
export class LandingComponent {

  protected isWeb = environment.environment === 'WEB'
  public constructor() {
    //
  }
}
