import { CdkOverlayOrigin } from '@angular/cdk/overlay'
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
import { NW_MAX_TRADESKILL_LEVEL } from '@nw-data/common'
import { NwModule } from '~/nw'
import { LayoutModule } from '../layout'

@Component({
  selector: 'nwb-tradeskill-level-input',
  templateUrl: './tradeskill-level-input.component.html',
  styleUrl: './tradeskill-level-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NwModule, LayoutModule],
  host: {
    class: 'bg-base-100 shadow-xl rounded-md aspect-square flex flex-col group',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: TradeskillLevelInputComponent,
    },
  ],
  hostDirectives: [CdkOverlayOrigin],
})
export class TradeskillLevelInputComponent implements ControlValueAccessor {
  @Input()
  public icon: string

  @Input()
  public label: string

  @Input()
  public maxLevel: number

  @Input()
  @HostBinding('style.minWidth.px')
  public minWidth: number

  @ViewChild('input')
  protected input: ElementRef<HTMLInputElement>

  protected get inputEl() {
    return this.input.nativeElement
  }

  protected cdkOrigin = inject(CdkOverlayOrigin)
  protected isSliderOpen = false
  protected minLevelValue = 1
  protected maxLevelValue = NW_MAX_TRADESKILL_LEVEL

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
  public onClick() {
    this.input.nativeElement.focus()
    this.input.nativeElement.select()
  }
}
