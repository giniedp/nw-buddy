import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { debounceTime, filter, switchMap } from 'rxjs'
import { BackendService } from '~/data/backend'
import { TransmogRecord, TransmogsService } from '~/data/transmogs'
import { NwModule } from '~/nw'
import { DataViewModule } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgEmptySet, svgFileImport, svgFilterList, svgGlobe, svgPlus } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import {
  HtmlHeadService,
  injectBreakpoint,
  injectChildRouteParam,
  injectQueryParam,
  injectRouteParam,
  selectSignal,
} from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { ScreenshotModule } from '~/widgets/screenshot'
import { TransmogLoadoutComponent } from './transmog-loadout'
import { TransmogCreationsListPageStore } from './transmog-set-list.store'

@Component({
  selector: 'nwb-transmog-set-list',
  templateUrl: './transmog-set-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    QuicksearchModule,
    ScreenshotModule,
    IonHeader,
    TooltipModule,
    DataViewModule,
    DataGridModule,
    ItemDetailModule,
    VirtualGridModule,
    LayoutModule,
    IconsModule,
    TransmogLoadoutComponent,
    FormsModule,
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    TransmogCreationsListPageStore,
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class TransmogSetListComponent {
  private router = inject(Router)
  private backend = inject(BackendService)
  private route = inject(ActivatedRoute)

  private service = inject(TransmogsService)
  private store = inject(TransmogCreationsListPageStore)
  private modal = inject(ModalService)

  protected quicksearch = inject(QuicksearchService)
  protected search = toSignal(this.quicksearch.query$.pipe(debounceTime(500)))

  protected title = 'Transmog Creations'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'transmogs-table'
  protected categoryParamName = 'category'
  protected categoryParam = toSignal(injectQueryParam(this.categoryParamName))
  protected category = selectSignal(this.categoryParam, (it) => {
    return it ? it : null
  })

  protected userId = toSignal(injectRouteParam('userid'))

  protected platform = inject(PlatformService)
  protected isLargeContent = selectSignal(injectBreakpoint('(min-width: 992px)'), (ok) => ok || this.platform.isServer)
  protected isChildActive = selectSignal(injectChildRouteParam('id'), (it) => !!it)
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  protected iconCreate = svgPlus
  protected iconMore = svgFilterList
  protected iconImport = svgFileImport
  protected iconGlobe = svgGlobe
  protected iconEmpty = svgEmptySet

  protected tags = this.store.tags
  protected tagsAreActive = computed(() => this.tags()?.some((it) => it.active))
  protected tagsOperator = this.store.tagsOperator
  protected items = this.store.displayRecords
  protected isLoading = this.store.isLoading
  protected isAvailable = this.store.isAvailable
  protected totalCount = this.store.totalCount
  protected displayCount = this.store.displayCount
  protected isEmpty = this.store.isEmpty
  protected trackBy = (it: TransmogRecord) => it.id

  public constructor(head: HtmlHeadService) {
    this.store.connectUser(this.userId)
    this.store.connectSearch(this.search)
    head.updateMetadata({
      title: 'Transmog Creations',
      description: 'A transmog creation tool for New World.',
    })

    effect(() => {
      const userId = this.backend.sessionUserId()
      if (userId && this.userId() === 'local') {
        this.router.navigate(['..', userId], { relativeTo: this.route })
      }
    })
  }

  protected deleteItem(item: TransmogRecord) {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete Transmog',
        body: 'Are you sure you want to delete this creation?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.service.delete(item.id)
      })
  }

  protected handleCreateClicked() {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Create',
        label: 'Name',
        value: `My New Transmog`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap((newName) => {
          return this.service.create({
            id: null,
            name: newName,
          })
        }),
      )
      .subscribe((record) => {
        this.router.navigate([record.id], { relativeTo: this.route })
      })
  }

  protected toggleTag(value: string) {
    this.store.toggleTag(value)
  }

  protected toggleTagsOperator() {
    this.store.toggleTagsOperator()
  }
}
