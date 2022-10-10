import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, ViewChild } from '@angular/core'
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms'
import { Optional } from 'ag-grid-community'
import { NwModule } from '~/nw'
import { DataTableAdapter } from './data-table-adapter'
import { DataTableComponent } from './data-table.component'

@Component({
  standalone: true,
  selector: 'nwb-data-table-picker',
  templateUrl: './data-table-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, DataTableComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: DataTablePicker,
    },
  ],
  host: {
    class: 'flex flex-col h-full bg-base-300 rounded-md p-3',
  },
})
export class DataTablePicker implements ControlValueAccessor {
  @Input()
  public adapter: DataTableAdapter<any>

  @ViewChild('table', { static: false })
  protected table: DataTableComponent<any>

  protected search: string
  protected itemId: string
  protected onChange = (value: string) => void 0
  protected onTouched = () => void 0
  protected touched = false
  protected disabled = false

  public constructor(
    @Optional()
    adapter: DataTableAdapter<unknown>
  ) {
    this.adapter = adapter
  }

  public writeValue(value: string): void {
    this.itemId = value
    if (this.itemId && this.table) {
      this.table.select([this.itemId])
    }
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
  private commitValue(value: string) {
    if (this.itemId !== value) {
      this.itemId = value
      this.onChange(this.itemId)
    }
  }
  protected onSelectionChange(ids: string[]) {
    this.commitValue(ids?.[0])
  }
}
