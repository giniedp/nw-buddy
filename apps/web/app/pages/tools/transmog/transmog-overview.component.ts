import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { TransmogService } from './transmog.service'
import { NavbarModule } from '~/ui/nav-toolbar'
import { RouterModule } from '@angular/router'
import { defer } from 'rxjs'
import { LayoutModule } from '~/ui/layout'
import { QuicksearchModule } from '~/ui/quicksearch'
import { FormsModule } from '@angular/forms'

@Component({
  standalone: true,
  selector: 'nwb-transmog-overview',
  templateUrl: './transmog-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, NavbarModule, RouterModule, LayoutModule, QuicksearchModule, FormsModule],
  host: {
    class: 'layout-col',
  },
})
export class TransmogOverviewComponent {

  private service = inject(TransmogService)

  protected categories$ = defer(() => this.service.categories$)
  protected genderFilter$ = this.service.select(({ genderFilter }) => genderFilter || '')

  public setGenderFilter(value: null | 'male' | 'female') {
    this.service.patchState({ genderFilter: value })
  }
}
