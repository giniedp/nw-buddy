import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HousingTableAdapter } from '~/widgets/adapter'
import { PriceImporterModule } from '~/widgets/price-importer/price-importer.module'
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
    NavbarModule,
    ScreenshotModule,
    IonicModule,
    PriceImporterModule,
    TooltipModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [
    HousingTableAdapter.provider(),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class HousingComponent {
  //
}
