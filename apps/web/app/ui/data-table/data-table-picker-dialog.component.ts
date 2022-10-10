import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, Component, Inject, Input, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Optional } from 'ag-grid-community'
import { NwModule } from '~/nw'
import { DataTableAdapter } from './data-table-adapter'
import { DataTableComponent } from './data-table.component'

@Component({
  standalone: true,
  selector: 'nwb-data-table-picker-dialog',
  templateUrl: './data-table-picker-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, DataTableComponent],
  host: {
    class: 'flex flex-col h-full bg-base-300 rounded-md p-3',
  },
})
export class DataTablePickerDialog implements AfterViewInit {
  @Input()
  public adapter: DataTableAdapter<any>

  @ViewChild('table', { static: false })
  protected table: DataTableComponent<any>

  protected search: string
  protected itemId: string

  protected touched = false
  protected disabled = false

  public constructor(
    private dialogRef: DialogRef,
    @Inject(DIALOG_DATA)
    private dialogData: string,
    @Optional()
    adapter: DataTableAdapter<unknown>
  ) {
    this.adapter = adapter
  }

  public ngAfterViewInit(): void {
    if (this.dialogRef) {
      this.writeValue(this.dialogData)
    }
  }

  public writeValue(value: string): void {
    this.itemId = value
    if (this.itemId && this.table) {
      this.table.select([this.itemId])
    }
  }

  private commitValue(value: string) {
    if (this.itemId !== value) {
      this.itemId = value
      this.dialogRef?.close(this.itemId)
    }
  }

  protected onSelectionChange(ids: string[]) {
    this.itemId = ids?.[0]
  }

  protected close() {
    this.dialogRef.close()
  }

  protected commit() {
    this.dialogRef.close(this.itemId || null)
  }
}
