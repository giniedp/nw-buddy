import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  standalone: true,
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
      multi:true,
      useExisting: ChipsInputComponent
    }
  ]
})
export class ChipsInputComponent implements ControlValueAccessor {

  @Input()
  public placeholder: string = ''

  @Input()
  public separator: string[] = [',', 'Enter']

  @ViewChild('input')
  protected input: ElementRef<HTMLInputElement>
  protected get inputEl() {
    return this.input.nativeElement
  }

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false
  protected value: string[]
  protected trackByIndex = (i: number) => i

  public constructor(private cdRef: ChangeDetectorRef) {
    //
  }

  public writeValue(value: any): void {
    console.log('writeValue', value)
    this.value = Array.isArray(value) ? value : null
    this.cdRef.markForCheck()
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
    if (this.separator.includes(e.key)) {
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
    this.value = [
      ...(this.value || []),
      value
    ]
    this.onChange(this.value)
  }

  protected removeChip(chip: string, i: number) {
    const value = [
      ...this.value || []
    ]
    value.splice(i, 1)
    this.value = value
    this.onChange(this.value)
  }
}
