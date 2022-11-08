import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NavToolbarModule } from '../nav-toolbar'
import { DataTableCategoriesDirective } from './data-table-categories.directive'

@Component({
  standalone: true,
  exportAs: 'tableHeader',
  selector: 'nwb-data-table-header',
  templateUrl: './data-table-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, NavToolbarModule],
  host: {
    class: 'flex flex-row overflow-hidden',
  },
})
export class DataTableCategoriesComponent extends DataTableCategoriesDirective {

}
