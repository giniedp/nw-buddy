import { CommonModule } from '@angular/common'
import { Component, effect, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { debounceTime, filter, switchMap } from 'rxjs'
import { GearsetRecord, GearsetsService } from '~/data'
import { NwModule } from '~/nw'
import { ShareService } from '~/pages/share'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { IconsModule } from '~/ui/icons'
import { svgFileImport, svgFilterList, svgPlus } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { injectRouteParam } from '~/utils'
import { GearsetsListPageStore } from './gearsets-list-page.store'
import { GearsetLoadoutItemComponent } from './loadout'
import { BackendService } from '~/data/backend'

@Component({
  selector: 'nwb-gearsets-list-page',
  templateUrl: './gearsets-list-page.component.html',
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
    GearsetLoadoutItemComponent,
  ],
  providers: [QuicksearchService, GearsetsListPageStore],
  host: {
    class: 'ion-page',
  },
})
export class GearsetsListPageComponent {
  protected iconCreate = svgPlus
  protected iconImport = svgFileImport
  protected iconMore = svgFilterList

  private backend = inject(BackendService)
  private service = inject(GearsetsService)
  private store = inject(GearsetsListPageStore)
  private quicksearch = inject(QuicksearchService)
  private modal = inject(ModalService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private share = inject(ShareService)
  protected userId = toSignal(injectRouteParam('userid'))
  protected search = toSignal(this.quicksearch.query$.pipe(debounceTime(500)))

  protected get filterTags() {
    return this.store.tags()
  }
  protected get isTagFilterActive() {
    return this.store.tags()?.some((it) => it.active)
  }
  protected get items() {
    return this.store.filteredRecords()
  }

  public constructor() {
    this.store.connectUser(this.userId)
    this.store.connectSearch(this.search)

    effect(() => {
      const userId = this.backend.session()?.id
      if (userId && this.userId() === 'local') {
        this.router.navigate(['..', userId], { relativeTo: this.route })
      }
      if (!userId && this.userId() !== 'local') {
        this.router.navigate(['..', 'local'], { relativeTo: this.route })
      }
    })
  }

  protected async handleCreate() {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Create new set',
        body: 'Name for the new gearset',
        value: `New Gearset`,
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

  protected handleDelete(gearset: GearsetRecord) {
    ConfirmDialogComponent.open(this.modal, {
      inputs: {
        title: 'Delete Gearset',
        body: 'Are you sure you want to delete this gearset?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.service.delete(gearset.id)
      })
  }

  protected async handleImport() {
    this.share.importItem(this.modal, this.router)
  }

  protected toggleTag(value: string) {
    this.store.toggleTag(value)
  }
}
