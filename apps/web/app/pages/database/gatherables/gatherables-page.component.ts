import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { filter, firstValueFrom, of } from 'rxjs'
import { NwModule } from '~/nw'
import { AgGrid } from '~/ui/data/ag-grid'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule, TableGridActionButton } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgDownload } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectBreakpoint, injectChildRouteParam, injectRouteParam, selectSignal } from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { GatherableService } from '~/widgets/data/gatherable'
import { GatherableTableAdapter, GatherableTableRecord } from '~/widgets/data/gatherable-table'
import { PriceImporterModule } from '~/widgets/price-importer/price-importer.module'
import { ScreenshotModule } from '~/widgets/screenshot'

@Component({
  selector: 'nwb-gatherables-page',
  templateUrl: './gatherables-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DataGridModule,
    DataViewModule,
    IconsModule,
    IonHeader,
    NwModule,
    LayoutModule,
    QuicksearchModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    VirtualGridModule,
    PriceImporterModule,
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    provideDataView({
      adapter: GatherableTableAdapter,
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class GatherablesPageComponent {
  protected title = 'Gatherables'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'gatherables-table'
  protected categoryParam = 'c'
  protected category = selectSignal(injectRouteParam(this.categoryParam), (it) => it || null)

  protected platform = inject(PlatformService)
  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected isChildActive = selectSignal(injectChildRouteParam('id'), (it) => !!it)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  private gatherableService = inject(GatherableService)

  public constructor(
    protected service: DataViewService<GatherableTableRecord>,
    protected search: QuicksearchService,
    protected modal: ModalService,
    head: HtmlHeadService,
  ) {
    service.patchState({ mode: 'table', modes: ['table'] })
    head.updateMetadata({
      url: head.currentUrl,
      title: 'New World - Gatherables DB',
    })
  }

  protected actions: TableGridActionButton[] = [
    {
      action: (grid: AgGrid) => {
        this.downloadPositions(grid)
      },
      icon: svgDownload,
      label: 'Download Positions',
      description: 'Download spawn positions of filtered items',
    },
  ]

  private downloadPositions(grid: AgGrid) {
    this.modal.withLoadingIndicator(
      {
        message: 'Generating data...',
      },
      async () => {
        const data = await this.generatePositionData(grid)
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
            body: `Data has been generated. Download size is ${readableSize} MB. Do you want to proceed?`,
            negative: 'Cancel',
            positive: 'Download',
          },
        })
          .result$.pipe(filter((it) => !!it))
          .subscribe(async () => {
            download(data, 'gatherables-positions.json', 'application/json')
          })
      },
    )
  }

  private async generatePositionData(grid: AgGrid<GatherableTableRecord>) {
    const gatherableIds: string[] = []
    grid.api.forEachNodeAfterFilter((node) => {
      gatherableIds.push(node.data.GatherableID)
    })
    const result = await firstValueFrom(this.gatherableService.gatherablesForDownload(of(gatherableIds)))
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
