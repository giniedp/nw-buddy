import { Directive, forwardRef, Injectable, Input } from '@angular/core'
import { ActivatedRoute} from '@angular/router'
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Subject, takeUntil } from 'rxjs'
import { DataTableAdapter } from './data-table-adapter'

@Injectable()
export abstract class CategoryLinkService {
  public abstract categoryLink(category: string | null): any
}

@Directive({
  selector: 'nwb-data-table-categories[categoryChildRoute]',
  providers: [{
    provide: CategoryLinkService,
    useExisting: forwardRef(() => CategoryChildRouteParamDirective)
  }]
})
export class CategoryChildRouteParamDirective extends CategoryLinkService {

  @Input()
  public childRouteIndex = '.'

  public categoryLink(category: string | null) {
    return [category || this.childRouteIndex]
  }
}


@Directive({
  selector: 'nwb-data-table[categoryRouteParam]',
})
export class CategoryRouteParamDirective {

  @Input()
  public set categoryRouteParam(value: string) {
    this.param$.next(value)
  }

  private param$ = new BehaviorSubject(null)
  private destroy$ = new Subject()

  public constructor(private route: ActivatedRoute, private adapter: DataTableAdapter<any>) {}

  public ngOnInit(): void {
    combineLatest({
      paramMap: this.route.paramMap,
      param: this.param$
    }).pipe(map(({ paramMap, param }) => paramMap.get(param || 'category')))

      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this.destroy$))
      .subscribe((category) => {
        this.adapter.category.next(category)
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }
}
