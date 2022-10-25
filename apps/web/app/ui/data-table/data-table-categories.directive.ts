import { ChangeDetectorRef, Directive, Optional } from '@angular/core'
import { defer, map, startWith } from 'rxjs'
import { DataTableAdapter } from './data-table-adapter'
import { CategoryLinkService } from './data-table-header-router.directive'

@Directive({
  standalone: true,
  exportAs: 'categories',
  selector: '[nwbTableCategories]',
})
export class DataTableCategoriesDirective {
  public categories = defer(() => this.adapter.entities)
    .pipe(startWith([]))
    .pipe(map((items) => this.adapter.extractCategories(items)))
    .pipe(
      map((items) => {
        return [
          {
            label: 'ALL',
            value: null,
            route: this.categoryLink(null)
          },
          ...items.map((it) => ({
            label: it,
            value: it,
            route: this.categoryLink(it)
          })),
        ]
      })
    )

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
