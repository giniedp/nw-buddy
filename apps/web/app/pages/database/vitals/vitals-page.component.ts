import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { filter } from 'rxjs'
import { NwModule } from '~/nw'
import { AgGrid } from '~/ui/data/ag-grid'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule, TableGridActionButton } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgDownload } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectBreakpoint, injectChildRouteParam, injectRouteParam, selectSignal } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { ItemTableRecord } from '~/widgets/data/item-table'
import { VitalTableAdapter, VitalTableRecord } from '~/widgets/data/vital-table'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-vitals-page',
  templateUrl: './vitals-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IconsModule,
    IonHeader,
    LayoutModule,
    NwModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    VirtualGridModule,
    SplitPaneDirective,
    SplitGutterComponent,
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    provideDataView({
      adapter: VitalTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class VitalsPageComponent {
  protected title = 'Vitals'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'vitals-table'
  protected categoryParam = 'c'
  protected category = selectSignal(injectRouteParam(this.categoryParam), (it) => it || null)

  protected platform = inject(PlatformService)
  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected isChildActive = selectSignal(injectChildRouteParam('id'), (it) => !!it)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  public constructor(
    protected service: DataViewService<ItemTableRecord>,
    protected search: QuicksearchService,
    private modal: ModalService,
    head: HtmlHeadService,
  ) {
    service.patchState({ mode: 'table', modes: ['table'] })
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Vitals & Creatures DB',
    })
  }

  protected actions: TableGridActionButton[] = [
    {
      action: (grid: AgGrid) => {
        this.downloadPositions(grid)
      },
      icon: svgDownload,
      label: 'Download Positions',
      description: 'Download spawn positions of filtered creatures',
    },
  ]

  private downloadPositions(grid: AgGrid) {
    this.modal.withLoadingIndicator(
      {
        message: 'Generating data...',
      },
      async () => {
        const data = this.generatePositionData(grid)
        if (!data) {
          return
        }
        const sizeInBytes = data.length
        const sizeInKb = sizeInBytes / 1024
        const sizeInMb = sizeInKb / 1024
        const readableSize = sizeInMb > 1 ? `${sizeInMb.toFixed(2)} MB` : `${sizeInKb.toFixed(2)} KB`
        ConfirmDialogComponent.open(this.modal, {
          inputs: {
            title: 'Confirm Download',
            body: `Data has been generated. Download size is ${readableSize}. Do you want to proceed?`,
            negative: 'Cancel',
            positive: 'Download',
          },
        })
          .result$.pipe(filter((it) => !!it))
          .subscribe(async () => {
            download(data, 'vitals-positions.json', 'application/json')
          })
      },
    )
  }

  private generatePositionData(grid: AgGrid<VitalTableRecord>) {
    const result: any[] = []
    grid.api.forEachNodeAfterFilter((node) => {
      const meta = node.data.$metadata
      if (!meta?.spawns || Object.keys(meta.spawns).length === 0) {
        return
      }
      result.push(meta)
    })
    return JSON.stringify(result, null, 2)
  }
}

function download(content: any, fileName: string, contentType: string) {
  const a = document.createElement('a')
  const file = new Blob([content], { type: contentType })
  a.href = URL.createObjectURL(file)
  a.download = fileName
  a.click()
}
