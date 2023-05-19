import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { BehaviorSubject, combineLatest, defer, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { shareReplayRefCount } from '~/utils'

function accumulate<T>(data: T[], startIndex: number, endIndex: number, key: keyof T) {
  let result = 0
  for (let i = startIndex; i <= endIndex; i++) {
    result += (data[i] as any)[key] as number
  }
  return result
}

@Component({
  selector: 'nwb-umbral-table',
  templateUrl: './umbral-table.component.html',
  styleUrls: ['./umbral-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content',
  },
})
export class UmbralTableComponent {
  @Input()
  public set gsMin(value: number) {
    this.gsMin$.next(value)
  }
  public get gsMin() {
    return this.gsMin$.value
  }

  @Input()
  public set gsMax(value: number) {
    this.gsMax$.next(value)
  }
  public get gsMax() {
    return this.gsMax$.value
  }

  public limit$ = defer(() => this.data$).pipe(map((data) => Math.max(...data.map((it) => it.Level)) + 1))

  public data$ = defer(() =>
    combineLatest({
      min: this.gsMin$,
      max: this.gsMax$,
      data: this.db.data.umbralgsupgrades(),
    })
  )
    .pipe(
      map(({ min, max, data }) => {
        if (min != null) {
          data = data.filter((it) => it.Level >= min)
        }
        if (max != null) {
          data = data.filter((it) => it.Level <= max)
        }
        return data.map((node, i) => {
          let iStart = i
          let iEnd = data.length - 1
          return {
            ...node,
            total: accumulate(data, iStart, iEnd, 'RequiredItemQuantity'),
          }
        })
      })
    )
    .pipe(shareReplayRefCount(1))

  private gsMin$ = new BehaviorSubject(null)
  private gsMax$ = new BehaviorSubject(null)

  public constructor(private db: NwDbService) {
    //
  }
}
