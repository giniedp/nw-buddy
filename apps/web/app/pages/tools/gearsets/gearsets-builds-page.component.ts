import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { filter, switchMap } from 'rxjs'
import { gearsetHasLinkedItems, GearsetRecord, GearsetsService } from '~/data'
import { BackendService } from '~/data/backend'
import { NwModule } from '~/nw'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import {
  svgBars,
  svgDiamond,
  svgEmptySet,
  svgFileImport,
  svgFilterList,
  svgFont,
  svgGear,
  svgGlobe,
  svgHelmetBattle,
  svgRotate,
  svgSort,
  svgTime,
} from '~/ui/icons/svg'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { GearsetBuildsCardComponent } from './gearset-builds-card.component'
import { GearsetsBuildsPageStore, SortOption } from './gearsets-builds-page.store'

@Component({
  selector: 'nwb-gearsets-builds-page',
  templateUrl: './gearsets-builds-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    QuicksearchModule,
    NavbarModule,
    IconsModule,
    TooltipModule,
    LayoutModule,
    VirtualGridModule,
    GearsetBuildsCardComponent,
    FormsModule,
  ],
  providers: [QuicksearchService, GearsetsBuildsPageStore],
  host: {
    class: 'ion-page',
  },
})
export class GearsetsBuildsPageComponent {
  protected iconMore = svgFilterList
  protected iconMenu = svgBars
  protected iconEmpty = svgEmptySet
  protected iconGearset = svgHelmetBattle
  protected iconGlobe = svgGlobe
  protected iconImport = svgFileImport
  protected iconRefresh = svgRotate
  protected iconSort = svgSort
  protected iconRating = svgDiamond
  protected iconTime = svgTime
  protected iconGearScore = svgGear
  protected iconAZ = svgFont

  private backend = inject(BackendService)
  private service = inject(GearsetsService)
  private store = inject(GearsetsBuildsPageStore)
  private quicksearch = inject(QuicksearchService)
  private modal = inject(ModalService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  
  protected search = toSignal(this.quicksearch.query$)
  protected queryParams = toSignal(this.route.queryParams, { initialValue: {} })

  protected isSignedIn = this.backend.isSignedIn
  protected tags = this.store.tags
  protected tagsOperator = this.store.tagsOperator
  protected sortBy = this.store.sortBy
  protected sortDirection = this.store.sortDirection
  protected isTagFilterActive = computed(() => this.store.tags()?.some((it) => it.active))
  protected items = this.store.displayRecords
  protected isLoading = this.store.showLoadingSpinner
  protected isAvailable = this.store.isAvailable
  protected totalCount = this.store.totalCount
  protected displayCount = this.store.displayCount
  protected isEmpty = this.store.isEmpty
  protected hasMore = this.store.hasMore
  protected trackBy = (it: GearsetRecord) => it.id

  public constructor() {
    this.store.connectSearch(this.search)
    
    // Initialize store from URL query params
    const params = this.queryParams()
    if (params['sort']) {
      const sortBy = params['sort'] as SortOption
      const sortDirection = params['sortDir'] as 'asc' | 'desc' | undefined
      
      // Set the sort option first
      if (sortBy !== this.store.sortBy()) {
        this.store.setSortBy(sortBy)
      }
      
      // Then override direction if specified in URL
      if (sortDirection && sortDirection !== this.store.sortDirection()) {
        this.store.setSortBy(sortBy) // This will toggle direction if same option
      }
    }
    if (params['tags']) {
      const tags = Array.isArray(params['tags']) ? params['tags'] : [params['tags']]
      tags.forEach(tag => this.store.toggleTag(tag))
    }
    if (params['tagsOp']) {
      if (params['tagsOp'] !== this.store.tagsOperator()) {
        this.store.toggleTagsOperator()
      }
    }
  }

  protected handleLoadMore() {
    this.store.loadMore()
  }

  protected handleRefresh() {
    this.store.refresh()
  }

  protected handleSortChange(sortBy: SortOption) {
    this.store.setSortBy(sortBy)
    const direction = this.store.sortDirection()
    const defaultDirection = sortBy === 'name' ? 'asc' : 'desc'
    
    this.updateUrlParams({ 
      sort: sortBy === 'likes' ? null : sortBy,
      sortDir: direction === defaultDirection ? null : direction
    })
  }

  protected toggleTag(tag: string) {
    this.store.toggleTag(tag)
    const activeTags = this.store.activeTags()
    this.updateUrlParams({ tags: activeTags.length > 0 ? activeTags : null })
  }

  protected toggleTagsOperator() {
    this.store.toggleTagsOperator()
    this.updateUrlParams({ tagsOp: this.store.tagsOperator() === 'OR' ? null : 'AND' })
  }

  private updateUrlParams(params: Record<string, any>) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }

  protected handleImportClicked(gearset: GearsetRecord) {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import Gearset',
        label: 'Name',
        value: gearset.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(
        filter((it) => !!it),
        switchMap((newName) => {
          return this.service.create({
            ...gearset,
            id: null,
            name: newName,
            status: 'private',
            // Remove sync-related fields
            syncState: undefined,
            ipnsKey: undefined,
            ipnsName: undefined,
          })
        }),
      )
      .subscribe((record) => {
        this.router.navigate(['/gearsets', record.userId, record.id])
      })
  }

  protected hasLinkedItems(record: GearsetRecord) {
    return gearsetHasLinkedItems(record)
  }
}
