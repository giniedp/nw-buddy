import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  ViewChild,
  inject,
} from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { InputSliderComponent } from '../input-slider'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'
import { CdkOverlayOrigin } from '@angular/cdk/overlay'
import { LayoutModule } from '../layout'

@Component({
  selector: 'nwb-level-input',
  templateUrl: './level-input.component.html',
  styleUrl: './level-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, InputSliderComponent, LayoutModule],
  host: {
    class: 'aspect-square',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: LevelInputComponent,
    },
  ],
  hostDirectives: [CdkOverlayOrigin],
})
export class LevelInputComponent implements ControlValueAccessor {
  @Input()
  @HostBinding('style.width.px')
  public width: number = null

  @ViewChild('input')
  protected input: ElementRef<HTMLInputElement>

  protected get inputEl() {
    return this.input.nativeElement
  }

  protected cdkOrigin = inject(CdkOverlayOrigin)
  protected isSliderOpen = false
  protected minLevelValue = 1
  protected maxLevelValue = NW_MAX_CHARACTER_LEVEL

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
  protected onOutsideClick() {
    if (document.activeElement !== this.input.nativeElement) {
      this.isSliderOpen = false
    }
  }

  @HostListener('click')
  protected onClick() {
    this.input.nativeElement.focus()
    this.input.nativeElement.select()
  }
}
