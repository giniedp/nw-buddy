import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core'
import { defer, map } from 'rxjs'
import { DataTableAdapter } from './data-table-adapter'

@Component({
  selector: 'nwb-data-table-categories',
  templateUrl: './data-table-categories.component.html',
  styleUrls: ['./data-table-categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableCategoriesComponent {

  public categories = defer(() => this.adapter.entities).pipe(
    map((items) => {
      return Array.from(new Set(items.map((it) => this.adapter.entityCategory(it)).filter((it) => !!it)))
    })
  )

  public get category() {
    return this.adapter.category.value
  }

  public get category$() {
    return this.adapter.category
  }

  public constructor(private adapter: DataTableAdapter<any>, private cdRef: ChangeDetectorRef) {}

  public selectCategory(value: string) {
    if (this.category !== value) {
      this.adapter.category.next(value)
      this.cdRef.markForCheck()
    }
  }
}
