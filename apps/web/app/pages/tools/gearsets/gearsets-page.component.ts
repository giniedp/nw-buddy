import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, inject } from '@angular/core'
import { Router, RouterModule } from '@angular/router'
import { IonHeader } from '@ionic/angular/standalone'
import { debounceTime, filter } from 'rxjs'
import { GearsetRecord } from '~/data'
import { NwModule } from '~/nw'
import { ShareService } from '~/pages/share'
import { IconsModule } from '~/ui/icons'
import { svgFileImport, svgPlus } from '~/ui/icons/svg'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/layout'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { GearsetsPageStore } from './gearsets-page.store'
import { GearsetLoadoutListComponent } from './loadout'

@Component({
  standalone: true,
  selector: 'nwb-gearsets-page',
  templateUrl: './gearsets-page.component.html',
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    QuicksearchModule,
    NavbarModule,
    IconsModule,
    TooltipModule,
    IonHeader,
    GearsetLoadoutListComponent,
  ],
  providers: [QuicksearchService, GearsetsPageStore],
  host: {
    class: 'layout-col',
  },
})
export class GearsetsPageComponent {
  protected iconCreate = svgPlus
  protected iconImport = svgFileImport

  private store = inject(GearsetsPageStore)
  private quicksearch = inject(QuicksearchService)
  private dialog = inject(Dialog)
  private router = inject(Router)
  private share = inject(ShareService)

  protected get tags() {
    return this.store.filterTags()
  }

  protected get items() {
    return this.store.filteredRecords()
  }

  public constructor() {
    this.store.connectDB()
    this.store.connectFilterQuery(this.quicksearch.query$.pipe(debounceTime(500)))
  }

  protected async handleCreate() {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Create new set',
        body: 'Give this set a name',
        input: `New Gearset`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe((newName) => {
        this.store.createRecord({
          id: null,
          name: newName,
        })
      })
  }

  protected handleDelete(gearset: GearsetRecord) {
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete Gearset',
        body: 'Are you sure you want to delete this gearset?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.store.destroyRecord(gearset.id)
      })
  }

  protected async handleImport() {
    this.share.importItem(this.dialog, this.router)
  }

  protected toggleTag(value: string) {
    this.store.toggleFilterTag(value)
  }
}
