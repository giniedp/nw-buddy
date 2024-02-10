import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, computed, inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { filter, map, switchMap } from 'rxjs'
import { SkillBuildRow } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { ShareService } from '~/pages/share'
import { DataViewModule, DataViewService, provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgFileImport, svgFilterList, svgPlus } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService } from '~/ui/layout'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService, injectBreakpoint, injectRouteParam, injectUrlParams, selectSignal } from '~/utils'
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { SkillsetTableAdapter } from '~/widgets/data/skillset-table'
import { openWeaponTypePicker } from '~/widgets/data/weapon-type'
import { ScreenshotModule } from '~/widgets/screenshot'
import { SkillTreesPageStore } from './skill-trees-page.store'

@Component({
  standalone: true,
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
  ],
  host: {
    class: 'ion-page',
  },
  providers: [
    SkillTreesPageStore,
    provideDataView({
      adapter: SkillsetTableAdapter,
      factory: () => {
        return {
          source: toObservable(inject(SkillTreesPageStore).rows),
        }
      },
    }),
    QuicksearchService.provider({
      queryParam: 'search',
    }),
  ],
})
export class SkillBuildsComponent {
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private share = inject(ShareService)
  private store = inject(SkillTreesPageStore)

  protected title = 'Skill Trees'
  protected filterParam = 'filter'
  protected selectionParam = 'id'
  protected persistKey = 'skilltrees-table'
  protected categoryParam = toSignal(injectRouteParam('category'))
  protected category = selectSignal(this.categoryParam, (it) => {
    return it ? it : null
  })

  protected isLargeContent = toSignal(injectBreakpoint('(min-width: 992px)'))
  protected isChildActive = toSignal(injectUrlParams('/:resource/:id', (it) => !!it?.['id']))
  protected showSidebar = computed(() => this.isLargeContent() && this.isChildActive())
  protected showModal = computed(() => !this.isLargeContent() && this.isChildActive())

  protected iconCreate = svgPlus
  protected iconMore = svgFilterList
  protected iconImport = svgFileImport
  protected tags = this.store.filterTags

  protected get isTagFilterActive() {
    return this.store.filterTags()?.some((it) => it.active)
  }

  protected get filterTags() {
    return this.store.filterTags()
  }

  public constructor(
    protected search: QuicksearchService,
    private modal: ModalService,
    private injector: Injector,
    protected dataView: DataViewService<any>,
    head: HtmlHeadService,
  ) {
    this.store.connectDB()

    dataView.patchState({ mode: 'grid', modes: ['grid'] })
    head.updateMetadata({
      title: 'Skill Builder',
      description: 'A Skill Buider tool for New World. Build your skill tree and share with your mates.',
    })
  }

  protected async importItem() {
    this.share.importItem(this.modal, this.router)
  }

  protected async createItem() {
    openWeaponTypePicker({
      injector: this.injector,
    })
      .pipe(
        filter((it) => !!it?.length),
        map((it) => NW_WEAPON_TYPES.find((type) => type.WeaponTypeID === String(it[0]))),
      )
      .pipe(
        switchMap((weapon) => {
          return this.store.createRecord({
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

  protected deleteItem(item: SkillBuildRow) {
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
        this.store.destroyRecord(item.record.id)
      })
  }

  protected toggleTag(value: string) {
    this.store.toggleFilterTag(value)
  }
}
