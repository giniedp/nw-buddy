import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, forwardRef, HostBinding, HostListener, Input } from '@angular/core'
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms'

@Component({
  selector: 'nwb-tree-node-toggle',
  templateUrl: './tree-node-toggle.component.html',
  styleUrls: ['./tree-node-toggle.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => TreeNodeToggleComponent),
    },
  ],
})
export class TreeNodeToggleComponent implements ControlValueAccessor {
  public value: boolean

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false

  @HostBinding('class.disabled')
  protected disabled: boolean

  @Input()
  @HostBinding('class.v-last')
  public isLast: boolean

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

  @HostListener('click')
  public toggle() {
    this.value = !this.value
    this.onChange(this.value)
  }
}
