import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { QuicksearchService } from '~/ui/quicksearch'
import { GearsetFormComponent } from './gearset-form.component'

@Component({
  standalone: true,
  selector: 'nwb-inventory-table',
  templateUrl: './inventory-table.component.html',
  styleUrls: ['./inventory-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, GearsetFormComponent],
  host: {
    class: 'layout-row',
  },
})
export class PlayerItemsTableComponentn {
  public constructor(public search: QuicksearchService) {
    //
  }
}
