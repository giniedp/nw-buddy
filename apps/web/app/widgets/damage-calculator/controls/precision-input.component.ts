import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'
import { patchPrecision } from '@nw-data/common'

@Component({
  selector: 'nwb-precision-input',
  template: `
    <ng-content selector="[start]" />
    <input
      type="number"
      #input
      [disabled]="disabled"
      [value]="inputValue"
      [min]="min"
      [max]="max"
      [step]="step"
      (input)="handleInputEvent($event)"
      (change)="handleChangeEvent($event)"
      (blur)="handleBlurEvent($event)"
      (focus)="handleFocusEvent($event)"
      (wheel)="handleWheelEvent($event)"
      (keydown)="handleKeyEvent($event)"
      class="min-w-0 w-full bg-transparent appearance-none text-right"
      [class.cursor-not-allowed]="disabled"
    />
    <ng-content selector="[end]" />
    @if (unit) {
      <span class="absolute right-[2px] top-0 bottom-0 text-xs flex items-center">{{ unit }}</span>
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: PrecisionInputComponent,
    },
  ],
  host: {
    class: 'relative',
    '[class.input-disabled]': 'disabled',
  },
})
export class PrecisionInputComponent implements ControlValueAccessor {
  @Input()
  public disabled: boolean = false

  @Input()
  public scale: number = 1

  @Input()
  public unit: string = ''

  @Input()
  public min: number = null

  @Input()
  public max: number = null

  @Input()
  public step: number = null

  @Input()
  public stepShift: number = null

  @Input()
  public stepCtrl: number = null

  @Input()
  public stepAlt: number = null

  @ViewChild('input', { read: ElementRef })
  protected input: ElementRef<HTMLInputElement>

  protected onChange = (value: number) => {}
  protected onTouched = () => {}
  protected touched = false
  private value: number = null
  protected get inputValue(): number {
    return patchPrecision(this.value * this.scale, 3)
  }
  protected set inputValue(value: number) {
    this.value = value / this.scale
    if (this.min !== null) {
      this.value = Math.max(this.min, this.value)
    }
    if (this.max !== null) {
      this.value = Math.min(this.max, this.value)
    }
    this.commit()
  }

  public writeValue(value: number): void {
    this.value = value ?? 0
  }
  public registerOnChange(fn: any): void {
    this.onChange = fn
  }
  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  public setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  @HostListener('click')
  protected handleClick() {
    this.input.nativeElement.focus()
  }

  protected handleInputEvent(event: Event): void {
    this.inputValue = (event.target as HTMLInputElement).valueAsNumber || 0
  }

  protected handleChangeEvent(event: Event): void {
    this.inputValue = (event.target as HTMLInputElement).valueAsNumber || 0
  }

  protected handleWheelEvent(event: WheelEvent): void {
    // only when the input is focused
    if (document.activeElement !== this.input.nativeElement) {
      return
    }
    event.preventDefault()
    const step = this.getStep(event)
    const direction = event.deltaY < 0 ? 1 : -1
    this.inputValue += step * direction
  }

  protected handleKeyEvent(event: KeyboardEvent): void {
    let direction = 0
    if (event.key === 'ArrowUp') {
      direction = 1
    } else if (event.key === 'ArrowDown') {
      direction = -1
    }
    if (direction) {
      event.preventDefault()
      this.inputValue += this.getStep(event) * direction
    }
  }

  protected handleBlurEvent(event: Event): void {
    this.onTouched()
  }

  protected handleFocusEvent(event: Event): void {
    this.onTouched()
  }

  private commit() {
    this.onChange(this.value)
  }

  private getStep(event: KeyboardEvent | WheelEvent): number {
    let step = this.step
    if (event.shiftKey) {
      step = this.stepShift ?? step
    } else if (event.ctrlKey) {
      step = this.stepCtrl ?? step
    } else if (event.altKey) {
      step = this.stepAlt ?? step
    }
    return step
  }
}
