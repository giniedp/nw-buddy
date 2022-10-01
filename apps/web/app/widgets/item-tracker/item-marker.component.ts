import { Component, OnInit, ChangeDetectionStrategy, Input, OnChanges, ChangeDetectorRef } from '@angular/core'
import { distinctUntilChanged, ReplaySubject, switchMap, takeUntil } from 'rxjs';
import { ItemPreferencesService } from '~/preferences';
import { DestroyService } from '~/utils';

@Component({
  selector: 'nwb-item-marker',
  templateUrl: './item-marker.component.html',
  styleUrls: ['./item-marker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
  host: {
    class: 'flex flex-row'
  }
})
export class ItemMarkerComponent implements OnInit, OnChanges {
  @Input()
  public set itemId(value: string) {
    this.itemId$.next(value)
  }

  private itemId$ = new ReplaySubject<string>(1)
  private trackedId: string
  private trackedValue: number

  public constructor(private destroy: DestroyService, private meta: ItemPreferencesService, private cdRef: ChangeDetectorRef) {

  }

  public ngOnInit(): void {
    this.itemId$
      .pipe(distinctUntilChanged())
      .pipe(switchMap((id) => this.meta.observe(id)))
      .pipe(takeUntil(this.destroy.$))
      .subscribe((data) => {
        this.trackedId = data.id
        this.trackedValue = this.cleanValue(data.meta?.mark)
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }

  private value(index: number) {
    return Math.pow(2, index)
  }
  public toggle(index: number) {
    let result = this.trackedValue
    if (this.checked(index)) {
      result = result & (~this.value(index))
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
