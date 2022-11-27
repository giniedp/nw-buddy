import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { LayoutModule } from '~/ui/layout'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ItemsTableAdapter } from '~/widgets/adapter'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-items-page',
  templateUrl: './items.component.html',
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
  providers: [ItemsTableAdapter.provider(), QuicksearchService],
})
export class ItemsComponent {}
