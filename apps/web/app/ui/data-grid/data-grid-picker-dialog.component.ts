import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject, Injector, NgZone, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '../icons'
import { svgChevronLeft } from '../icons/svg'
import { QuicksearchModule, QuicksearchService } from '../quicksearch'
import { DataGridPanelButtonComponent, DataGridPanelComponent, DataGridQuickfilterDirective } from './components'
import { DataGridComponent } from './data-grid.component'
import { DataTableSourceProvideOptions, provideTableSource } from './data-table-source'

export interface DataGridPickerOptions<T> {
  /**
   * The dialog title
   */
  title: string
  /**
   * The preselected value
   *
   * @remarks
   * provide an array to enable multi selection
   */
  selection?: string | string[]
  /**
   * Key to load and persist grid layout and filter settings
   */
  persistKey?: string
  /**
   * Grid source options
   */
  grid: DataTableSourceProvideOptions<T>
  /**
   * Dialog configuration
   */
  config: DialogConfig<string[]>
}

@Component({
  standalone: true,
  selector: 'nwb-data-grid-picker-dialog',
  templateUrl: './data-grid-picker-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    DataGridComponent,
    DataGridPanelComponent,
    DataGridPanelButtonComponent,
    DataGridQuickfilterDirective,
    QuicksearchModule,
    IconsModule,
  ],
  providers: [QuicksearchService],
  host: {
    class: 'layout-col bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class DataGridPicker {
  public static open<T>(dialog: Dialog, options: DataGridPickerOptions<T>) {
    return dialog.open<string[]>(DataGridPicker, {
      ...options.config,
      data: options,
      injector: Injector.create({
        parent: options.config.injector,
        providers: [provideTableSource(options.grid)],
      }),
    })
  }

  @ViewChild('table', { static: false })
  protected table: DataGridComponent<any>

  protected iconBack = svgChevronLeft
  protected search: string
  protected selection: string[]
  protected title: string
  protected persistKey: string

  public constructor(
    private dialogRef: DialogRef<string[]>,
    private zone: NgZone,
    @Inject(DIALOG_DATA)
    options: DataGridPickerOptions<any>
  ) {
    this.title = options.title
    if (options.selection) {
      this.selection = Array.isArray(options.selection) ? options.selection : [options.selection]
    }
    this.persistKey = options.persistKey
  }

  protected onSelectionChange(value: string[]) {
    this.selection = value
  }

  protected onRowDoubleClick(value: string) {
    this.zone.run(() => {
      this.dialogRef.close([value])
    })
  }

  protected clear() {
    this.selection = []
  }

  protected close() {
    this.zone.run(() => {
      this.dialogRef.close()
    })
  }

  protected commit() {
    this.zone.run(() => {
      this.dialogRef.close(this.selection)
    })
  }
}
