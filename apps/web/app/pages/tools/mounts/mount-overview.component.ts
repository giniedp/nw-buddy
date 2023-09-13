import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ViewChild, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule, RouterOutlet } from '@angular/router'
import { uniq } from 'lodash'
import { NwDbService, NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule } from '~/ui/quicksearch'
import { selectStream } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-mount-overview',
  templateUrl: './mount-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, NavbarModule, RouterModule, LayoutModule, QuicksearchModule, FormsModule],
  host: {
    class: 'layout-col',
  },
})
export class MountOverviewComponent {
  protected mounts$ = inject(NwDbService).mounts
  protected categories$ = selectStream(this.mounts$, (mounts) => {
    return ['all', ...uniq(mounts.map((it) => it.MountType))]
  })

  @ViewChild(RouterOutlet, { static: true })
  protected outlet: RouterOutlet

  protected get isIndex() {
    return !this.outlet.isActivated
  }
}
