import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { asyncScheduler, distinctUntilChanged, map, queueScheduler, Subject, subscribeOn, takeUntil } from 'rxjs'
import { ItemsTableComponent } from '~/widgets/items-table/items-table.component'

@Component({
  selector: 'nwb-items',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'page-frame',
  },
})
export class ItemsComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(ItemsTableComponent, { static: true })
  public table: ItemsTableComponent

  public quickFilter: string = ''

  public get hasSelection() {
    return this.selection?.length > 0
  }

  public category: string
  public categories: string[]
  public selection: string[]
  private destroy$ = new Subject()

  public constructor(
    private cdRef: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  public ngOnInit(): void {
    if (this.route.firstChild) {
      this.selection = [this.route.firstChild.snapshot.paramMap.get('id')]
      this.cdRef.markForCheck()
    }
    this.route.queryParamMap
      .pipe(map((m) => m.get('category')))
      .pipe(distinctUntilChanged())
      .pipe(takeUntil(this.destroy$))
      .subscribe((category) => {
        this.category = category
        this.table.setCategory(category)
        this.cdRef.markForCheck()
      })

    this.table.categories
      .pipe(subscribeOn(asyncScheduler))
      .pipe(takeUntil(this.destroy$))
      .subscribe((categories) => {
        this.categories = categories
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges() {}

  public ngOnDestroy() {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public selected(selection: string[]) {
    this.selection = selection
    this.router.navigate([this.selection?.[0] || '/'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve',
    })
    this.cdRef.markForCheck()
  }

  public selectCategory(category: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category },
      queryParamsHandling: 'merge',
    })
  }
}
