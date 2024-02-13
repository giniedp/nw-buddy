import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { patchState, signalState } from '@ngrx/signals'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgEllipsisVertical, svgPlus, svgTrashCan } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { ValueStack, ValueStackItem, valueStackSum } from './damage-calculator.store'

@Component({
  standalone: true,
  selector: 'nwb-ctrl-stack-input',
  templateUrl: './ctrl-stack-input.component.html',
  styleUrl: './ctrl-stack-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, InputSliderComponent, IconsModule],
  host: {
    class: 'form-control',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: CtrlStackInputComponent,
    },
  ],
})
export class CtrlStackInputComponent implements ControlValueAccessor {
  @Input()
  public step: number = 0.1

  @Input()
  public min: number = null

  @Input()
  public labelHidden: boolean = false

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

  protected sum = computed(() => valueStackSum(this.state()))
  protected iconDelete = svgTrashCan
  protected iconLeft = svgChevronLeft
  protected iconMore = svgEllipsisVertical
  protected iconAdd = svgPlus
  protected isOpen = false
  protected get inlineInputDisabled() {
    return this.isOpen || this.state().stack.length > 0
  }
  protected get inlineValue() {
    return this.state().value
  }
  protected set inlineValue(value: number) {
    patchState(this.state, { value })
    this.commitValue()
  }
  protected get stack() {
    return this.state().stack
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
    patchState(this.state, ({ stack }) => ({
      stack: [
        ...stack,
        {
          value: 0,
        },
      ],
    }))
    this.commitValue()
  }

  protected removeFromStack(index: number) {
    patchState(this.state, ({ stack }) => ({
      stack: stack.filter((_, i) => i !== index),
    }))
    this.commitValue()
  }

  protected toggleInStack(index: number) {
    this.patchStackItem(index, { disabled: !this.state().stack[index]?.disabled })
  }

  protected setStackItemLabel(index: number, label: string) {
    this.patchStackItem(index, { label })
  }

  protected setStackItemCap(index: number, cap: number) {
    this.patchStackItem(index, { cap })
  }

  protected setStackItemValue(index: number, value: number) {
    this.patchStackItem(index, { value })
  }

  protected patchStackItem(index: number, data: Partial<ValueStackItem>) {
    patchState(this.state, ({ stack }) => ({
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
    this.commitValue()
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
  protected commitValue() {
    this.onChange(this.state())
  }
}
