import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HtmlHeadService, injectUrlParams } from '~/utils'
import { TerritoryModule } from '~/widgets/territory'

@Component({
  standalone: true,
  selector: 'nwb-territories-page',
  templateUrl: './territories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, TerritoryModule, QuicksearchModule, LayoutModule, IonSegment, IonSegmentButton],
  providers: [QuicksearchService],
  host: {
    class: 'ion-page',
  },
})
export class TerritoriesComponent {
  protected tab$ = injectUrlParams('/territories/:tab', (it) => it?.['tab'] || 'list')
  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Territories',
      description: 'Overview of all Territories in New World',
      noFollow: true,
      noIndex: true,
    })
  }
}
