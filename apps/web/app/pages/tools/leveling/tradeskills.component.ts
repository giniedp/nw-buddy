import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { NwTradeskillService } from '~/nw/tradeskill'
import { LayoutModule } from '~/ui/layout'
import { injectRouteParam, selectSignal } from '~/utils'
import { TradeskillsModule } from '~/widgets/tradeskills'

@Component({
  selector: 'nwb-tradeskills-page',
  templateUrl: './tradeskills.component.html',
  styleUrls: ['./tradeskills.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TradeskillsModule, LayoutModule, IonSegment, IonSegmentButton],
  host: {
    class: 'ion-page',
  },
})
export class TradeskillsComponent {
  protected tab$ = injectRouteParam('tab')
  protected tab = toSignal(this.tab$)
  protected categories = selectSignal(this.service.categories, (list) => {
    return (list || []).map((it) => it.toLowerCase())
  })
  protected skills = toSignal(this.service.skills)

  public constructor(private service: NwTradeskillService) {
    //
  }

  public skillsByCategory(name: string) {
    return this.service.skillsByCategory(name)
  }
}
