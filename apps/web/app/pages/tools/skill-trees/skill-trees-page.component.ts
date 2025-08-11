import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, OnInit, computed, effect, inject } from '@angular/core'
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { filter, map, switchMap, takeUntil } from 'rxjs'
import { SkillTreesService, SkillTreeRow } from '~/data'
import { BackendService } from '~/data/backend'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { ShareService } from '~/pages/share'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgEmptySet, svgFileImport, svgFilterList, svgGlobe, svgPlus, svgSitemap } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { SplitGutterComponent, SplitPaneDirective } from '~/ui/split-container'
import { TooltipModule } from '~/ui/tooltip'
import {
  HtmlHeadService,
  injectBreakpoint,
  injectChildRouteParam,
  injectParentRouteParam,
  injectQueryParam,
  injectRouteParam,
  selectSignal,
} from '~/utils'
import { PlatformService } from '~/utils/services/platform.service'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { SkillTreeTableAdapter } from '~/widgets/data/skill-tree-table'
import { openWeaponTypePicker } from '~/widgets/data/weapon-type'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SkillTreesPageStore } from './skill-trees-page.store'
import { FormsModule } from '@angular/forms'

@Component({
  selector: 'nwb-skill-trees-page',
  templateUrl: './skill-trees-page.component.html',
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
    SplitPaneDirective,
    SplitGutterComponent,
    FormsModule
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    SkillTreesPageStore,
    provideDataView({
      adapter: SkillTreeTableAdapter,
      factory: () => {
        return {
          source: toObservable(inject(SkillTreesPageStore).displayRows),
        }
      },
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class SkillTreesPageComponent {
  private router = inject(Router)
  private backend = inject(BackendService)
  private route = inject(ActivatedRoute)
  private share = inject(ShareService)
  private store = inject(SkillTreesPageStore)
  private service = inject(SkillTreesService)
  private modal = inject(ModalService)
  private injector = inject(Injector)

  protected search = inject(QuicksearchService)
  protected dataView = inject(DataViewService<any>)

  protected title = 'Skill Trees'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'skilltrees-table'
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
  protected iconSkilLTree = svgSitemap
  protected iconGlobe = svgGlobe
  protected iconEmpty = svgEmptySet

  protected tags = this.store.tags
  protected tagsAreActive = computed(() => this.tags()?.some((it) => it.active))
  protected tagsOperator = this.store.tagsOperator
  protected isLoading = this.store.isLoading
  protected isAvailable = this.store.isAvailable
  protected isEmpty = this.store.isEmpty
  protected displayCount = this.store.displayCount

  public constructor(head: HtmlHeadService) {
    this.store.load(this.userId)
    this.dataView.patchState({ mode: 'grid', modes: ['grid'] })
    head.updateMetadata({
      title: 'Skill Builder',
      description: 'A Skill Buider tool for New World. Build your skill tree and share with your mates.',
    })

    effect(() => {
      const userId = this.backend.sessionUserId()
      if (userId && this.userId() === 'local') {
        this.router.navigate(['..', userId], { relativeTo: this.route })
      }
    })
  }

  protected async importItem() {
    this.share.importItem(this.modal, this.router)
  }

  protected async handleCreateClicked() {
    openWeaponTypePicker({
      injector: this.injector,
    })
      .pipe(
        filter((it) => !!it?.length),
        map((it) => NW_WEAPON_TYPES.find((type) => type.WeaponTypeID === String(it[0]))),
      )
      .pipe(
        switchMap((weapon) => {
          return this.service.create({
            id: null,
            name: `New Skill Tree`,
            tree1: null,
            tree2: null,
            weapon: weapon.WeaponTag,
          })
        }),
      )
      .subscribe((result) => {
        if (result) {
          this.router.navigate(['.', result.id], { relativeTo: this.route })
        }
      })
  }

  protected deleteItem(item: SkillTreeRow) {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete Skill Tree',
        body: 'Are you sure you want to delete this skill tree?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.service.delete(item.record.id)
      })
  }

  protected handleTagToggle(value: string) {
    this.store.toggleTag(value)
  }

  protected toggleTagsOperator() {
    this.store.toggleTagsOperator()
  }
}
