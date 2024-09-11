import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  computed,
  effect,
  inject,
  input,
} from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
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
export class ItemMarkerComponent {
  private meta = inject(ItemPreferencesService)
  public itemId = input.required<string>()
  public hasValue = computed(() => !!this.trackedValue())
  private data = toSignal(toObservable(this.itemId).pipe(switchMap((id) => this.meta.observe(id))))
  private trackedId = computed(() => this.data()?.id)
  private trackedValue = computed(() => cleanValue(this.data()?.meta?.mark))

  public toggle(index: number) {
    let result = this.trackedValue()
    if (this.checked(index)) {
      result = result & ~indexValue(index)
    } else {
      result = result | indexValue(index)
    }
    this.submitValue(result)
  }

  public checked(index: number) {
    return !!(this.trackedValue() & indexValue(index))
  }

  private submitValue(value: number | string) {
    this.meta.merge(this.trackedId(), {
      mark: cleanValue(value),
    })
  }
}

function indexValue(index: number) {
  return Math.pow(2, index)
}
function cleanValue(value: string | number | boolean) {
  if (typeof value !== 'number') {
    value = Number(value)
  }
  if (Number.isFinite(value)) {
    return value
  }
  return null
}
