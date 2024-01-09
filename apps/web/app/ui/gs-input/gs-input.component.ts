import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NW_MAX_GEAR_SCORE, NW_MIN_GEAR_SCORE } from '@nw-data/common'
import { GsSliderComponent } from './gs-slider.component'

@Component({
  standalone: true,
  selector: 'nwb-gs-input',
  template: `
    <input
      type="number"
      [min]="min"
      [max]="max"
      [step]="step"
      [value]="value"
      (change)="change()"
      class="input text-right w-full"
      [class.input-xs]="size === 'xs'"
      [class.input-sm]="size === 'sm'"
      [class.input-md]="size === 'md'"
      [class.input-lg]="size === 'lg'"
      [class.input-bordered]="bordered"
      [class.input-ghost]="ghost"
      [class.input-primary]="color === 'primary'"
      [class.input-secondary]="color === 'secondary'"
      [disabled]="disabled"
      (focus)="isSliderOpen = true"
      #input
    />

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="cdkOrigin"
      [cdkConnectedOverlayOpen]="isSliderOpen"
      [cdkConnectedOverlayHasBackdrop]="false"
      [cdkConnectedOverlayPositions]="[
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 2 },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 2 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 2 }
      ]"
      [cdkConnectedOverlayPanelClass]="['bg-base-100', 'bg-opacity-75', 'rounded-md', 'shadow-md', 'p-2']"
      (overlayOutsideClick)="onOutsideClick()"
      (backdropClick)="isSliderOpen = false"
      (detach)="isSliderOpen = false"
    >
      <nwb-gs-slider
        [ngModel]="value"
        (ngModelChange)="setValue($event)"
        [min]="min"
        [max]="max"
        [bars]="bars"
        [values]="values"
        [size]="size"
        [color]="color"
        class="block w-96"
      />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, OverlayModule, GsSliderComponent],
  hostDirectives: [CdkOverlayOrigin],
  host: {
    class: 'layout-content',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: GsInputComponent,
    },
  ],
})
export class GsInputComponent implements ControlValueAccessor {
  @Input()
  public min: number = NW_MIN_GEAR_SCORE

  @Input()
  public max: number = NW_MAX_GEAR_SCORE

  @Input()
  public step: number

  @Input()
  public bars: boolean

  @Input()
  public values: boolean

  @Input()
  public bordered: boolean

  @Input()
  public ghost: boolean

  @Input()
  public size: 'xs' | 'sm' | 'md' | 'lg' = 'md'

  @Input()
  public color: 'primary' | 'secondary'

  @Input()
  public slider: boolean

  @ViewChild('input', { static: true, read: ElementRef })
  protected input: ElementRef<HTMLInputElement>

  protected isSliderOpen = false

  public constructor(protected cdkOrigin: CdkOverlayOrigin) {
    //
  }

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false
  protected value: number
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

  protected change() {
    this.setValue(this.input.nativeElement.valueAsNumber)
  }

  protected setValue(value: number) {
    if (this.value !== value) {
      this.value = value
      this.onChange(value)
    }
  }

  protected onFocus() {
    if (this.slider) {
      this.isSliderOpen = true
    }
  }

  protected onOutsideClick() {
    if (document.activeElement !== this.input.nativeElement) {
      this.isSliderOpen = false
    }
  }
}
