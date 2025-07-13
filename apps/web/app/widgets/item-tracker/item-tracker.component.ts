import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnChanges,
  OnInit,
  computed,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { map, switchMap } from 'rxjs'
import { ItemMeta, ItemPreferencesService } from '~/preferences'

@Component({
  selector: 'nwb-price-tracker,nwb-stock-tracker',
  exportAs: 'gsTracker',
  templateUrl: './item-tracker.component.html',
  styleUrls: ['./item-tracker.component.scss'],
  providers: [],
  host: {
    '[class.tooltip]': 'isEmpty() && !!emptyTip()',
    '[class.opacity-25]': 'isEmpty()',
    '[class.hover:opacity-100]': 'isEmpty()',
    '[class.transition-opacity]': 'isEmpty()',
  },
  standalone: false,
})
export class ItemTracker implements OnInit, OnChanges, AfterViewChecked {
  private meta = inject(ItemPreferencesService)
  private cdRef = inject(ChangeDetectorRef)
  private elRef = inject(ElementRef)
  private mode: keyof ItemMeta = this.elRef.nativeElement.tagName.toLowerCase().match(/nwb-(\w+)-tracker/)[1] as any

  public itemId = input.required<string>()
  public multiply = input(1)
  public format = input<string>()
  public emptyText = input('✏️')
  public emptyTip = input('Edit')
  public isEmpty = computed(() => !(this.trackedValue() > 0))
  public showInput = model(false)

  @HostBinding('attr.data-tip')
  protected get attrDataTip() {
    return this.emptyTip()
  }

  public get value() {
    return this.trackedValue()
  }
  public set value(v: number) {
    this.submitValue(v)
  }

  public input = viewChild<string, ElementRef<HTMLInputElement>>('input', { read: ElementRef })
  private data = toSignal(
    toObservable(this.itemId)
      .pipe(switchMap((id) => this.meta.observe(id)))
      .pipe(
        map((data) => {
          return {
            id: data?.id,
            value: cleanValue(data.meta?.[this.mode]),
          }
        }),
      ),
  )
  private trackedId = computed(() => this.data()?.id)
  private trackedValue = computed(() => this.data()?.value)

  public constructor() {}

  public ngOnInit(): void {}

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }

  public ngAfterViewChecked(): void {
    if (this.showInput() && this.input()) {
      this.input().nativeElement.focus()
    }
  }

  public closeInput(e: Event) {
    if (this.showInput()) {
      e.stopImmediatePropagation()
      if (e instanceof KeyboardEvent && this.input) {
        this.input().nativeElement.blur()
      } else {
        this.showInput.set(false)
      }
    }
  }

  @HostListener('click', ['$event'])
  public openInput(e: Event) {
    if (!this.showInput()) {
      e.stopImmediatePropagation()
      this.showInput.set(true)
      setTimeout(() => {
        this.input().nativeElement?.select()
      })
    }
  }

  public submitValue(value: number | string) {
    this.showInput.set(false)
    this.meta.merge(this.trackedId(), {
      [this.mode]: cleanValue(value),
    })
  }
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
