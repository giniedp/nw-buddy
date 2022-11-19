import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NwModule } from '~/nw'

@Component({
  standalone: true,
  selector: 'nwb-weapon-level-input',
  templateUrl: './weapon-level-input.component.html',
  styleUrls: ['./weapon-level-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NwModule],
  host: {
    class:
      'bg-base-100 rounded-md flex flex-col cursor-pointer',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: WeaponLevelInputComponent,
    },
  ],
})
export class WeaponLevelInputComponent implements ControlValueAccessor {
  @Input()
  public icon: string

  @Input()
  public label: string

  @Input()
  public maxLevel: number

  @ViewChild('input')
  protected input: ElementRef<HTMLInputElement>

  protected get inputEl() {
    return this.input.nativeElement
  }

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false
  protected value: number
  protected get modelValue() {
    return this.value
  }
  protected set modelValue(value: number) {
    this.value = value
    this.commitValue()
  }

  public writeValue(value: any): void {
    this.value = value
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
  protected commitValue() {
    this.onChange(this.value)
  }

  @HostListener('click')
  public onClick() {
    this.input.nativeElement.focus()
    this.input.nativeElement.select()
  }
}
