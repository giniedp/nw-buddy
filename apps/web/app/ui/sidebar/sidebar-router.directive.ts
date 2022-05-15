import { Directive, Input } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { distinctUntilChanged, map, Subject, takeUntil } from 'rxjs'
import { SidebarComponent } from './sidebar.component'

@Directive({
  selector: '[nwbSidebarRouter],[nwbSidebarRouteParam]',
})
export class SidebarRouterDirective {
  @Input()
  public nwbSidebarRouteParam = 'cat'

  private destroy$ = new Subject()

  public constructor(private route: ActivatedRoute, private router: Router, private parent: SidebarComponent) {}

  public ngOnInit(): void {
    this.route.paramMap
      .pipe(map((m) => m.get(this.nwbSidebarRouteParam)))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this.destroy$))
      .subscribe((category) => {
        this.parent.selectCategory(category)
      })

    this.parent.categoryChange
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        const params = {
          ...this.route.snapshot.params,
          [this.nwbSidebarRouteParam]: value,
        }
        if (!value) {
          delete params[this.nwbSidebarRouteParam]
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
