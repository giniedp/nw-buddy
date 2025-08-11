import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, input, signal, viewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  selector: 'nwb-chips-input',
  templateUrl: './chips-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'flex flex-row items-center flex-wrap gap-1',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ChipsInputComponent,
    },
  ],
})
export class ChipsInputComponent implements ControlValueAccessor {
  public readonly placeholder = input<string>('')
  public readonly separator = input<string[]>([',', 'Enter'])
  public readonly maxLength = input<number>(20)
  readonly input = viewChild<ElementRef<HTMLInputElement>>('input')

  protected get inputEl() {
    return this.input().nativeElement
  }

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false
  protected value = signal<string[]>(null)

  public writeValue(value: any): void {
    this.value.set(Array.isArray(value) ? value : null)
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn
  }
  public registerOnTouched(fn: any): void {
    this.onTouched = fn
  }
  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled
  }

  protected onInputKey(e: KeyboardEvent) {
    if (this.separator().includes(e.key)) {
      e.preventDefault()
      this.commitValue()
    }
  }

  protected onInputBlur(e: Event) {
    this.commitValue()
  }

  protected commitValue() {
    const value = String(this.inputEl.value).trim()
    this.inputEl.value = ''
    if (!value) {
      return
    }
    this.value.set([...(this.value() || []), value])
    this.onChange(this.value())
  }

  protected removeChip(chip: string, i: number) {
    const value = [...(this.value() || [])]
    value.splice(i, 1)
    this.value.set(value)
    this.onChange(this.value())
  }
}
