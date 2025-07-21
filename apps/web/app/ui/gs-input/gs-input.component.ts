import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, inject, input, model, signal, viewChild } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { NW_MAX_GEAR_SCORE, NW_MIN_GEAR_SCORE } from '@nw-data/common'
import { GsSliderComponent } from './gs-slider.component'

@Component({
  selector: 'nwb-gs-input',
  template: `
    <input
      type="number"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [value]="value()"
      (change)="change()"
      class="input text-right w-full"
      [class.input-xs]="size() === 'xs'"
      [class.input-sm]="size() === 'sm'"
      [class.input-md]="size() === 'md'"
      [class.input-lg]="size() === 'lg'"
      [class.input-bordered]="bordered()"
      [class.input-ghost]="ghost()"
      [class.input-primary]="color() === 'primary'"
      [class.input-secondary]="color() === 'secondary'"
      [disabled]="disabled()"
      (focus)="isOpen.set(true)"
      #input
    />

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="cdkOrigin"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayHasBackdrop]="false"
      [cdkConnectedOverlayPositions]="[
        { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 2 },
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 2 },
        { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 2 },
      ]"
      [cdkConnectedOverlayPanelClass]="['bg-base-100/75', 'rounded-md', 'shadow-md', 'p-2']"
      (overlayOutsideClick)="onOutsideClick()"
      (backdropClick)="isOpen.set(false)"
      (detach)="isOpen.set(false)"
    >
      <nwb-gs-slider
        [ngModel]="value()"
        (ngModelChange)="setValue($event)"
        [min]="min()"
        [max]="max()"
        [bars]="bars()"
        [values]="values()"
        [size]="size()"
        [color]="color()"
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
  protected cdkOrigin = inject(CdkOverlayOrigin)
  public readonly min = input<number>(NW_MIN_GEAR_SCORE)
  public readonly max = input<number>(NW_MAX_GEAR_SCORE)
  public readonly step = input<number>(undefined)
  public readonly bars = input<boolean>(undefined)
  public readonly values = input<boolean>(undefined)
  public readonly bordered = input<boolean>(undefined)
  public readonly ghost = input<boolean>(undefined)
  public readonly size = input<'xs' | 'sm' | 'md' | 'lg'>('md')
  public readonly color = input<'primary' | 'secondary'>(undefined)
  public readonly slider = input<boolean>(undefined)
  public readonly disabled = model<boolean>(false)
  protected readonly input = viewChild('input', { read: ElementRef })
  protected isOpen = signal(false)
  protected touched = signal(false)
  protected value = signal<number>(null)

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

  protected change() {
    this.setValue(this.input().nativeElement.valueAsNumber)
  }

  protected setValue(value: number) {
    if (this.value() !== value) {
      this.value.set(value)
      this.onChange(value)
    }
  }

  protected onFocus() {
    if (this.slider()) {
      this.isOpen.set(true)
    }
  }

  protected onOutsideClick() {
    if (document.activeElement !== this.input().nativeElement) {
      this.isOpen.set(false)
    }
  }
}
