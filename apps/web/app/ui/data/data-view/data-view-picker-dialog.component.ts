import { DIALOG_DATA, Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Inject, Injector, NgZone } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwModule } from '~/nw'
import { IconsModule } from '../../icons'
import { svgChevronLeft } from '../../icons/svg'
import { QuicksearchModule, QuicksearchService } from '../../quicksearch'
import { TooltipModule } from '../../tooltip'
import { DataViewMode, DataViewService } from '../data-view/data-view.service'
import { DataViewProvideOptions, provideDataView } from '../data-view/provider'
import { DataGridModule } from '../table-grid'
import { VirtualGridModule } from '../virtual-grid'
import { DataViewToggleComponent } from './data-view-toggle.component'
import { DataViewOptionsMenuComponent } from './data-view-options-menu.component'

export interface DataViewPickerOptions<T> {
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
  selection?: Array<string | number>
  /**
   * The display mode to use. If null, the user can switch between grid and list
   */
  displayMode?: DataViewMode[]
  /**
   * Key to load and persist grid layout and filter settings
   */
  persistKey?: string
  /**
   * Data view options
   */
  dataView: DataViewProvideOptions<T>
  /**
   * Dialog configuration
   */
  config: DialogConfig<string[]>
}

@Component({
  standalone: true,
  selector: 'nwb-data-view-picker-dialog',
  templateUrl: './data-view-picker-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    FormsModule,
    IconsModule,
    NwModule,
    QuicksearchModule,
    TooltipModule,
    VirtualGridModule,
    DataViewToggleComponent,
    DataViewOptionsMenuComponent,
  ],
  providers: [QuicksearchService],
  host: {
    class: 'layout-col bg-base-100 border border-base-100 rounded-md overflow-hidden',
  },
})
export class DataViewPicker {
  public static open<T>(dialog: Dialog, options: DataViewPickerOptions<T>) {
    return dialog.open<Array<string | number>>(DataViewPicker, {
      ...options.config,
      data: options,
      injector: Injector.create({
        parent: options.config.injector,
        providers: [provideDataView(options.dataView)],
      }),
    })
  }

  protected iconBack = svgChevronLeft
  protected search: string
  protected selection: Array<string | number>
  protected title: string
  protected persistKey: string
  public constructor(
    private dialogRef: DialogRef<Array<string | number>>,
    private zone: NgZone,
    protected service: DataViewService<any>,
    @Inject(DIALOG_DATA)
    options: DataViewPickerOptions<any>
  ) {
    this.title = options.title
    if (options.displayMode) {
      this.service.setMode(options.displayMode)
    }
    if (options.selection) {
      this.selection = Array.isArray(options.selection) ? options.selection : [options.selection]
    }
    this.persistKey = options.persistKey
  }

  protected onSelectionChange(value: Array<string | number>) {
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
