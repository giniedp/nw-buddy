import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import { uniq } from 'lodash'
import { NwModule } from '~/nw'
import { eqCaseInsensitive } from '~/utils'
import { ChipsInputComponent } from './chips-input.component'

export interface TagsInputPaneState {
  preset: string[]
  selection: string[]
}
@Component({
  selector: 'nwb-chips-input-pane',
  templateUrl: './chips-input-pane.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ChipsInputComponent, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: ChipsInputPaneComponent,
    },
  ],
  host: {
    class: 'layout-content',
  },
})
export class ChipsInputPaneComponent extends ComponentStore<TagsInputPaneState> implements ControlValueAccessor {
  @Input()
  public set tags(value: string[]) {
    this.patchState({ preset: value })
  }

  @Input()
  public placeholder: string

  protected readonly paneTags$ = this.select(selectPaneTags)
  protected readonly inputTags$ = this.select(selectInputTags)
  protected trackByIndex = (i: number) => i
  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false

  public constructor() {
    super({
      selection: [],
      preset: [],
    })
  }

  public writeValue(value: any): void {
    this.patchState({
      selection: Array.isArray(value) ? value : [],
    })
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

  protected toggleTag(value: string) {
    const selection = [...(this.get().selection || [])]
    const index = selection.findIndex((it) => eqCaseInsensitive(it, value))
    if (index >= 0) {
      selection.splice(index, 1)
    } else {
      selection.push(value)
    }
    this.patchState({
      selection: selection,
    })
    this.commitValue()
  }

  protected updateInputTags(values: string[]) {
    const paneTags =
      selectPaneTags(this.get())
        .filter((it) => it.checked)
        .map((it) => it.value) || []
    const inputTags = values || []
    this.patchState({
      selection: uniq([...paneTags, ...inputTags]),
    })
    this.commitValue()
  }

  protected commitValue() {
    this.onChange(this.get().selection || [])
  }
}

function selectPaneTags({ preset, selection }: TagsInputPaneState) {
  return preset.map((tag) => {
    return {
      value: tag,
      checked: selection?.some((it) => eqCaseInsensitive(it, tag)),
    }
  })
}

function selectInputTags({ preset, selection }: TagsInputPaneState) {
  return selection.filter((tag) => !preset?.some((it) => eqCaseInsensitive(it, tag)))
}
