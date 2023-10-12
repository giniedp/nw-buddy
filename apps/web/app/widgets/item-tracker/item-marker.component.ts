import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ReplaySubject, distinctUntilChanged, switchMap } from 'rxjs'
import { ItemPreferencesService } from '~/preferences'

@Component({
  selector: 'nwb-item-marker',
  templateUrl: './item-marker.component.html',
  styleUrls: ['./item-marker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
  host: {
    class: 'flex flex-row',
  },
})
export class ItemMarkerComponent implements OnInit, OnChanges {
  @Input()
  public set itemId(value: string) {
    this.itemId$.next(value)
  }

  private itemId$ = new ReplaySubject<string>(1)
  private trackedId: string
  private trackedValue: number

  public constructor(private meta: ItemPreferencesService, private cdRef: ChangeDetectorRef) {
    this.itemId$
      .pipe(distinctUntilChanged())
      .pipe(switchMap((id) => this.meta.observe(id)))
      .pipe(takeUntilDestroyed())
      .subscribe((data) => {
        this.trackedId = data.id
        this.trackedValue = this.cleanValue(data.meta?.mark)
        this.cdRef.markForCheck()
      })
  }

  public ngOnInit(): void {}

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }

  private value(index: number) {
    return Math.pow(2, index)
  }
  public toggle(index: number) {
    let result = this.trackedValue
    if (this.checked(index)) {
      result = result & ~this.value(index)
    } else {
      result = result | this.value(index)
    }
    this.submitValue(result)
  }

  public checked(index: number) {
    return !!(this.trackedValue & this.value(index))
  }

  private submitValue(value: number | string) {
    this.meta.merge(this.trackedId, {
      mark: this.cleanValue(value),
    })
    this.cdRef.markForCheck()
  }

  private cleanValue(value: string | number | boolean) {
    if (typeof value !== 'number') {
      value = Number(value)
    }
    if (Number.isFinite(value)) {
      return value
    }
    return null
  }
}
