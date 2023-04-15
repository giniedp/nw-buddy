import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { StatusEffectsTableAdapter } from '~/widgets/adapter'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  standalone: true,
  selector: 'nwb-status-effects-page',
  templateUrl: './status-effects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataTableModule,
    IonicModule,
    NavToolbarModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
  ],
  host: {
    class: 'layout-col',
  },
  providers: [StatusEffectsTableAdapter.provider(), QuicksearchService],
})
export class StatusEffectsComponent {
  //
}
