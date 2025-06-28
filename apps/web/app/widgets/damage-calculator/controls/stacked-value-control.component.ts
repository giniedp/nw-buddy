import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { PartialStateUpdater, patchState, signalState } from '@ngrx/signals'
import { uniq } from 'lodash'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgBars, svgChevronLeft, svgEllipsisVertical, svgInfinity, svgPlus, svgTrashCan } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { DamageCalculatorStore } from '../damage-calculator.store'
import { DamageModStack, DamageModStackItem, damageModStackItemEnabled, damageModSum } from '../damage-mod-stack'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  selector: 'nwb-stacked-value-control',
  templateUrl: './stacked-value-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    PrecisionInputComponent,
    FormsModule,
    LayoutModule,
    IconsModule,
  ],
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
  private store = inject(DamageCalculatorStore)

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
  public set data(data: DamageModStack) {
    patchState(this.state, {
      value: data?.value,
      stack: data?.stack || [],
    })
  }

  private state = signalState<DamageModStack>({
    value: 0,
    stack: [],
  })

  private sum = computed(() => damageModSum(this.state(), this.store.attackContext()))
  protected iconDelete = svgTrashCan
  protected iconLeft = svgChevronLeft
  protected iconMore = svgEllipsisVertical
  protected iconMenu = svgBars
  protected iconInfinity = svgInfinity
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

  protected isItemEnabled(node: DamageModStackItem) {
    return damageModStackItemEnabled(node, this.store.attackContext())
  }

  protected isTagEnabled(node: DamageModStackItem, tag: DamageModStackItem['tags'][0]) {
    return node.tags?.includes(tag)
  }

  protected isInfinite(value: number) {
    return !!value && !Number.isFinite(value)
  }

  protected addToStack() {
    this.patchState(({ stack }) => {
      const value = stack[stack.length - 1]?.value ?? 0
      const cap = stack[stack.length - 1]?.cap ?? null
      return {
        stack: [
          ...stack,
          {
            value: Number.isFinite(value) ? value : 0,
            cap: Number.isFinite(cap) ? cap : null,
          },
        ],
      }
    })
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

  protected setStackItemTag(index: number, tag: DamageModStackItem['tags'][0], enabled: boolean) {
    const tags = [...(this.state().stack[index]?.tags || [])]
    if (enabled) {
      tags.push(tag)
    } else {
      tags.splice(tags.indexOf(tag), 1)
    }
    this.patchStackItem(index, { tags: uniq(tags) })
  }

  protected patchStackItem(index: number, data: Partial<DamageModStackItem>) {
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

  protected onChange = (value: DamageModStack) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false

  public writeValue(value: DamageModStack): void {
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

  private patchState(update: Partial<DamageModStack> | PartialStateUpdater<DamageModStack>) {
    patchState(this.state, update)
    this.onChange(this.state())
  }
}
