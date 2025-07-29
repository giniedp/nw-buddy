import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
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
export class ChipsInputPaneComponent implements ControlValueAccessor {
  public tags = input<string[]>([])
  public placeholder = input<string>(undefined)
  public maxLength = input<number>(undefined)

  protected selection = signal<string[]>([])
  protected paneTags = computed(() => {
    return selectPaneTags({
      preset: this.tags(),
      selection: this.selection(),
    })
  })
  protected inputTags = computed(() => {
    return selectInputTags({
      preset: this.tags(),
      selection: this.selection(),
    })
  })

  protected onChange = (value: unknown) => {}
  protected onTouched = () => {}
  protected touched = false
  protected disabled = false

  public writeValue(value: any): void {
    this.selection.set(Array.isArray(value) ? value : [])
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
    const selection = [...(this.selection() || [])]
    const index = selection.findIndex((it) => eqCaseInsensitive(it, value))
    if (index >= 0) {
      selection.splice(index, 1)
    } else {
      selection.push(value)
    }
    this.selection.set(selection)
    this.commitValue()
  }

  protected updateInputTags(values: string[]) {
    const paneTags =
      selectPaneTags({
        preset: this.tags(),
        selection: this.selection(),
      })
        .filter((it) => it.checked)
        .map((it) => it.value) || []
    const inputTags = values || []
    this.selection.set(uniq([...paneTags, ...inputTags]))
    this.commitValue()
  }

  protected commitValue() {
    this.onChange(this.selection() || [])
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
