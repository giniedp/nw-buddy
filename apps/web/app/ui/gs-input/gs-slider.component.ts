import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, OnChanges, input, model, signal, viewChild } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NW_MAX_GEAR_SCORE, NW_MIN_GEAR_SCORE } from '@nw-data/common'

interface Bar {
  flex: number
  value: number
}

@Component({
  selector: 'nwb-gs-slider',
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
            @if (bar.value && bars()) {
              |
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
      useExisting: GsSliderComponent,
    },
  ],
})
export class GsSliderComponent implements ControlValueAccessor, OnChanges {
  public readonly min = input<number>(NW_MIN_GEAR_SCORE)
  public readonly max = input<number>(NW_MAX_GEAR_SCORE)
  public readonly step = input<number>(undefined)
  public readonly bars = input<boolean>(undefined)
  public readonly values = input<boolean>(undefined)
  public readonly barsStep = input<number>(100)
  public readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md')
  public readonly color = input<'primary' | 'secondary'>(undefined)
  readonly input = viewChild('input', { read: ElementRef })

  protected touched = signal(false)
  protected disabled = model(false)
  protected value = signal<number>(null)
  protected barNodes: Bar[] = []

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
    for (let i = min; i < max; i += step) {
      bars.push({ flex: 0, value: i })
      bars.push({
        flex: (Math.min(max, i + step) - i) / step,
        value: null,
      })
    }
    bars.push({ flex: 0, value: max })
    this.barNodes = bars
  }

  protected change() {
    const value = this.input().nativeElement.valueAsNumber
    if (this.value() !== value) {
      this.value.set(value)
      this.onChange(value)
    }
  }
}
