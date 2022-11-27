import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { HousingTableAdapter } from '~/widgets/adapter'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-housing-page',
  templateUrl: './housing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    QuicksearchModule,
    DataTableModule,
    NavToolbarModule,
    ScreenshotModule,
    IonicModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [HousingTableAdapter.provider(), QuicksearchService],
})
export class HousingComponent {
  //
}
