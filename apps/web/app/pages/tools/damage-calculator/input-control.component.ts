import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NwModule } from '~/nw'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'

@Component({
  standalone: true,
  selector: 'nwb-input-control',
  templateUrl: './input-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, InputSliderComponent, LayoutModule, FormsModule],
  host: {
    class: 'form-control',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CtrlSimpleInputComponent,
    },
  ],
})
export class CtrlSimpleInputComponent implements ControlValueAccessor {

  protected value: number = 0

  protected get inputValue() {
    return this.value
  }
  protected set inputValue(value: number) {
    this.value = value
    this.commitValue()
  }

  @Input()
  public min: number = null
  @Input()
  public max: number = null
  @Input()
  public step: number = null
  @Input()
  public slider: boolean = null
  @Input()
  public labelHidden: boolean = null

  protected onChange = (value: number) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false

  public writeValue(value: number): void {
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
}
