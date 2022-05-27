import { Directive, Input } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { distinctUntilChanged, map, Subject, takeUntil } from 'rxjs'
import { DataTableAdapter } from './data-table-adapter'

@Directive({
  selector: 'nwb-data-table-categories[routeParam]',
})
export class DataTableCategoriesRouterDirective {
  @Input()
  public routeParam = 'cat'

  private destroy$ = new Subject()

  public constructor(private route: ActivatedRoute, private router: Router, private adapter: DataTableAdapter<any>) {}

  public ngOnInit(): void {
    this.route
      .paramMap
      .pipe(map((m) => m.get(this.routeParam)))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this.destroy$))
      .subscribe((category) => {
        this.adapter.category.next(category)
      })

    this.adapter.category
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const params = {
          ...this.route.snapshot.params,
          [this.routeParam]: value,
        }
        if (!value) {
          delete params[this.routeParam]
        }
        this.router.navigate([params], {
          relativeTo: this.route,
        })
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
