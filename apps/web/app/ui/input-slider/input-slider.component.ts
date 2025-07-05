import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnChanges,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'

interface Bar {
  flex: number
  value: number
}

@Component({
  selector: 'nwb-input-slider',
  template: `
    <input
      type="range"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [value]="value()"
      (change)="change()"
      (input)="change()"
      [class.w-full]="true"
      [class.range]="true"
      [class.range-xs]="size() === 'xs'"
      [class.range-sm]="size() === 'sm'"
      [class.range-md]="size() === 'md'"
      [class.range-lg]="size() === 'lg'"
      [class.range-primary]="color() === 'primary'"
      [class.range-secondary]="color() === 'secondary'"
      [disabled]="disabled()"
      #input
    />
    @if (bars() || values()) {
      <div class="w-full flex text-xs px-2">
        @for (bar of barNodes; track $index) {
          <span [style.flex]="bar.flex" class="w-[1px] flex flex-col gap-1">
            @if (bar.value != null && bars()) {
              <span> | </span>
            }
            @if (values()) {
              <span class="w-full flex justify-center">{{ bar.value }}</span>
            }
          </span>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  host: {
    class: 'block',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: InputSliderComponent,
    },
  ],
})
export class InputSliderComponent implements ControlValueAccessor, OnChanges {
  public readonly min = input<number>(0)
  public readonly max = input<number>(100)
  public readonly step = input<number>(undefined)
  public readonly bars = input<boolean>(undefined)
  public readonly values = input<boolean>(undefined)
  public readonly barsStep = input<number>(10)
  public readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md')
  public readonly color = input<'primary' | 'secondary'>(undefined)
  readonly input = viewChild('input', { read: ElementRef })

  protected barNodes: Bar[] = []
  protected readonly touched = signal(false)
  protected readonly disabled = model(false)
  protected readonly value = signal<number>(null)

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  public writeValue(value: any): void {
    this.value.set(value)
  }
  public registerOnChange(fn: any): void {
    this.onChange = fn
  }
  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  public setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled)
  }

  public ngOnChanges(): void {
    const min = this.min()
    const max = this.max()
    const step = this.barsStep()
    const bars: Bar[] = []

    for (let i = min; i <= max; i++) {
      if (i === min || i === max || i % step === 0) {
        bars.push({ flex: 0, value: i })
      }
    }
    this.barNodes = bars
      .map((it, i, list) => {
        const next = list[i + 1] || list[list.length - 1]
        return [
          it,
          {
            flex: (next.value - it.value) / step,
            value: null,
          },
        ]
      })
      .flat()
  }

  protected change() {
    const value = this.input().nativeElement.valueAsNumber
    if (this.value() !== value) {
      this.value.set(value)
      this.onChange(value)
    }
  }
}
