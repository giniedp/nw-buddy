import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { QuicksearchService } from '~/ui/quicksearch'
import { GearsetFormComponent } from './gearset-form.component'

@Component({
  standalone: true,
  selector: 'nwb-inventory-table',
  templateUrl: './inventory-table.component.html',
  styleUrls: ['./inventory-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NwModule, DataTableModule, GearsetFormComponent],
  host: {
    class: 'layout-col xl:flex-row w-full layout-gap',
  },
})
export class PlayerItemsTableComponentn {
  public constructor(public search: QuicksearchService) {
    //
  }
}
