import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { PartialStateUpdater, patchState, signalState } from '@ngrx/signals'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgEllipsisVertical, svgPlus, svgTrashCan } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { ValueStack, ValueStackItem, valueStackSum } from '../damage-calculator.store'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  standalone: true,
  selector: 'nwb-stacked-value-control',
  templateUrl: './stacked-value-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, PrecisionInputComponent, FormsModule, InputSliderComponent, IconsModule],
  host: {
    class: 'flex flex-col self-start bg-base-200 rounded-md max-w-full',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: StackedValueControlComponent,
    },
  ],
})
export class StackedValueControlComponent implements ControlValueAccessor {

  @Input()
  public set percent(value: boolean) {
    if (value) {
      this.stepShift = 10
      this.stepCtrl = 1
      this.step = 0.1
      this.stepAlt = 0.01
      this.scale = 100
      this.unit = '%'
    } else {
      this.scale = 1
    }
  }

  @Input()
  public scale: number = 1

  @Input()
  public unit: string = null

  @Input()
  public min: number = null

  @Input()
  public max: number = null

  @Input()
  public step: number = 0.1

  @Input()
  public stepCtrl: number = null

  @Input()
  public stepShift: number = null

  @Input()
  public stepAlt: number = null

  @Input()
  public labelHidden: boolean = false

  @Input()
  public lockPreset: boolean = false

  @Input()
  public set data(data: ValueStack) {
    patchState(this.state, {
      value: data?.value,
      stack: data?.stack || [],
    })
  }

  private state = signalState<ValueStack>({
    value: 0,
    stack: [],
  })

  private sum = computed(() => valueStackSum(this.state()))
  protected iconDelete = svgTrashCan
  protected iconLeft = svgChevronLeft
  protected iconMore = svgEllipsisVertical
  protected iconAdd = svgPlus
  protected isOpen = false
  protected get inlineInputDisabled() {
    return this.lockPreset || this.isOpen || this.state().stack.length > 0
  }
  protected get value() {
    return this.state.value()
  }
  protected set value(value: number) {
    this.patchState({ value })
  }
  protected get stack() {
    return this.state.stack()
  }
  protected get total() {
    return this.sum().value
  }
  protected get overflow() {
    return this.sum().overflow
  }

  public constructor() {
    //
  }

  protected addToStack() {
    this.patchState(({ stack }) => ({
      stack: [
        ...stack,
        {
          value: stack[stack.length - 1]?.value ?? 0,
          cap: stack[stack.length - 1]?.cap ?? null,
        },
      ],
    }))
  }

  protected removeFromStack(index: number) {
    this.patchState(({ stack }) => ({
      stack: stack.filter((_, i) => i !== index),
    }))
  }

  protected toggleInStack(index: number) {
    this.patchStackItem(index, { disabled: !this.state().stack[index]?.disabled })
  }

  protected setStackItemEnabled(index: number, value: boolean) {
    this.patchStackItem(index, { disabled: !value })
  }

  protected setStackItemLabel(index: number, label: string) {
    this.patchStackItem(index, { label })
  }

  protected setStackItemCap(index: number, cap: number) {
    this.patchStackItem(index, { cap })
  }

  protected setStackItemValue(index: number, value: number) {
    this.patchStackItem(index, { value: value })
  }

  protected patchStackItem(index: number, data: Partial<ValueStackItem>) {
    this.patchState(({ stack }) => ({
      stack: stack.map((it, i) => {
        if (i !== index) {
          return it
        }
        return {
          ...it,
          ...data,
        }
      }),
    }))
  }

  protected onChange = (value: ValueStack) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false

  public writeValue(value: ValueStack): void {
    this.data = value
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

  private patchState(update: Partial<ValueStack> | PartialStateUpdater<ValueStack>) {
    patchState(this.state, update)
    this.onChange(this.state())
  }
}
