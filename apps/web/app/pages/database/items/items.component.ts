import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableAdapter, DataTableModule } from '~/ui/data-table'
import { NavToobalModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { ItemsTableAdapter } from '~/widgets/adapter'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-items-page',
  templateUrl: './items.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, QuicksearchModule, DataTableModule, NavToobalModule, ScreenshotModule],
  host: {
    class: 'layout-col bg-base-300 rounded-md overflow-clip',
  },
  providers: [DataTableAdapter.provideClass(ItemsTableAdapter), QuicksearchService],
})
export class ItemsComponent {

}
