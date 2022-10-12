import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Optional } from '@angular/core'
import { RouterModule } from '@angular/router'
import { defer, map, startWith } from 'rxjs'
import { DataTableAdapter } from './data-table-adapter'
import { CategoryLinkService } from './data-table-categories-router.directive'

@Component({
  standalone: true,
  selector: 'nwb-data-table-categories',
  templateUrl: './data-table-categories.component.html',
  styleUrls: ['./data-table-categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  host: {
    class: 'menu'
  }
})
export class DataTableCategoriesComponent {

  public categories = defer(() => this.adapter.entities)
  .pipe(startWith([]))
  .pipe(map((items) => this.adapter.extractCategories(items)))
  .pipe(map((items) => {
    return [
      {
        label: 'ALL',
        value: null
      },
      ...items.map((it) => ({
        label: it,
        value: it
      }))
    ]
  }))

  public get category() {
    return this.adapter.category.value
  }

  public get category$() {
    return this.adapter.category
  }

  public get isRoutable() {
    return !!this.router
  }
  public constructor(
    private adapter: DataTableAdapter<any>,
    private cdRef: ChangeDetectorRef,
    @Optional()
    private router: CategoryLinkService
  ) {}

  public selectCategory(value: string) {
    if (this.category !== value) {
      this.adapter.category.next(value)
      this.cdRef.markForCheck()
    }
  }

  public categoryLink(value: string | null) {
    return this.router?.categoryLink(value) || null
  }

  public categoryClicked(value: string | null, e: Event) {
    if (this.router) {
      return
    }
    e.preventDefault()
    if (this.adapter.category.value !== value) {
      this.adapter.category.next(value)
      this.cdRef.markForCheck()
    }
  }
}

