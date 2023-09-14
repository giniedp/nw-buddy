import { Dialog, DialogConfig, DialogRef, DIALOG_DATA } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Inject,
  Injector,
  Input,
  NgZone,
  Provider,
  Type,
  ViewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Optional } from '@ag-grid-community/core'
import { NwModule } from '~/nw'
import { IconsModule } from '../icons'
import { svgChevronLeft } from '../icons/svg'
import { QuicksearchModule, QuicksearchService } from '../quicksearch'
import { DataTableAdapter, dataTableProvider } from './data-table-adapter'
import { DataTablePanelButtonComponent } from './data-table-panel-button.component'
import { DataTableComponent } from './data-table.component'

export interface DataTablePickerDialogOptions<T> {
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
   * Whether multiple values can be selected and returned
   */
  multiselect?: boolean
  /**
   * The table adapter class or a table adapter provider configuration
   */
  adapter: Provider[] | Type<DataTableAdapter<T>>
  /**
   * Dialog configuration
   */
  config: DialogConfig<string[]>
}

@Component({
  standalone: true,
  selector: 'nwb-data-table-picker-dialog',
  templateUrl: './data-table-picker-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    DataTableComponent,
    DataTablePanelButtonComponent,
    QuicksearchModule,
    IconsModule,
  ],
  providers: [QuicksearchService],
  host: {
    class: 'layout-col bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class DataTablePickerDialog implements AfterViewInit {
  public static open<T>(dialog: Dialog, options: DataTablePickerDialogOptions<T>) {
    return dialog.open<string[]>(DataTablePickerDialog, {
      ...options.config,
      data: options,
      injector: Injector.create({
        providers: [
          Array.isArray(options.adapter)
            ? options.adapter
            : dataTableProvider({
                adapter: options.adapter,
              }),
        ],
        parent: options.config.injector,
      }),
    })
  }

  @Input()
  public adapter: DataTableAdapter<any>

  @ViewChild('table', { static: false })
  protected table: DataTableComponent<any>

  protected iconBack = svgChevronLeft
  protected search: string
  protected selection: string[]
  protected title: string
  protected multiSelect: boolean

  public constructor(
    private dialogRef: DialogRef<string[]>,
    private zone: NgZone,
    @Optional()
    adapter: DataTableAdapter<unknown>,
    @Inject(DIALOG_DATA)
    options: DataTablePickerDialogOptions<any>
  ) {
    this.adapter = adapter
    this.title = options.title
    if (options.selection) {
      this.selection = Array.isArray(options.selection) ? options.selection : [options.selection]
    }
    this.multiSelect = options.multiselect
  }

  public ngAfterViewInit(): void {
    if (Array.isArray(this.selection)) {
      this.table.select(this.selection)
    }
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
    this.table.select([])
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
