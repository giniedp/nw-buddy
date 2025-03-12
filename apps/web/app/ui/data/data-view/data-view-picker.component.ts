import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, Input, NgZone, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ModalController } from '@ionic/angular/standalone'
import { defer, from } from 'rxjs'
import { NwModule } from '~/nw'
import { LayoutModule } from '~/ui/layout'
import { IconsModule } from '../../icons'
import { svgChevronLeft } from '../../icons/svg'
import { QuicksearchModule, QuicksearchService } from '../../quicksearch'
import { TooltipModule } from '../../tooltip'
import { DataViewMode, DataViewService } from '../data-view/data-view.service'
import { DataViewProvideOptions, provideDataView } from '../data-view/provider'
import { DataGridModule } from '../table-grid'
import { VirtualGridModule } from '../virtual-grid'
import { DataViewOptionsMenuComponent } from './data-view-options-menu.component'
import { DataViewToggleComponent } from './data-view-toggle.component'

export interface DataViewPickerOptions<T = unknown> {
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
   *
   */
  cssClassModal?: string

  injector: Injector
}

@Component({
  selector: 'nwb-data-view-picker',
  templateUrl: './data-view-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    FormsModule,
    IconsModule,
    NwModule,
    QuicksearchModule,
    LayoutModule,
    TooltipModule,
    VirtualGridModule,
    DataViewToggleComponent,
    DataViewOptionsMenuComponent,
  ],
  providers: [QuicksearchService],
  host: {
    class: 'ion-page bg-base-100 border border-base-100 rounded-md',
  },
})
export class DataViewPicker<T> {
  public static from<T>(options: DataViewPickerOptions<T>) {
    return defer(() => from(this.open(options)))
  }
  public static async open<T>(options: DataViewPickerOptions<T>) {
    const injector = Injector.create({
      parent: options.injector,
      providers: [
        provideDataView(options.dataView),
        {
          provide: ModalController,
          useFactory: () => new ModalController(),
        },
      ],
    })
    const ctrl = injector.get(ModalController)
    const modal = await ctrl.create({
      component: DataViewPicker,
      componentProps: {
        title: options.title,
        selection: options.selection,
        persistKey: options.persistKey,
        displayMode: options.displayMode,
      },
      cssClass: options.cssClassModal || 'ion-modal-full xl:ion-modal-lg',
    })
    modal.present()
    const { data, role } = await modal.onWillDismiss()
    return data
  }

  @Input()
  public title: DataViewPickerOptions<T>['title']

  @Input()
  public selection: DataViewPickerOptions<T>['selection']

  @Input()
  public persistKey: DataViewPickerOptions<T>['persistKey']

  @Input()
  public set displayMode(value: DataViewPickerOptions<T>['displayMode']) {
    this.service.setMode(value)
  }

  protected iconBack = svgChevronLeft
  protected search: string
  protected service = inject(DataViewService<any>)
  private zone = inject(NgZone)
  private ctrl = inject(ModalController)

  protected onSelectionChange(value: Array<string | number>) {
    this.selection = value
  }

  protected onRowDoubleClick(value: string) {
    this.zone.run(() => {
      this.ctrl.dismiss([value])
    })
  }

  protected clear() {
    this.selection = []
  }

  protected close() {
    this.zone.run(() => {
      this.ctrl.dismiss()
    })
  }

  protected commit() {
    this.zone.run(() => {
      this.ctrl.dismiss(this.selection)
    })
  }
}
