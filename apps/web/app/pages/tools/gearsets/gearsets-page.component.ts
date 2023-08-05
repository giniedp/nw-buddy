import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, OnInit } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { filter } from 'rxjs'
import { GearsetRow, GearsetsStore } from '~/data'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { IconsModule } from '~/ui/icons'
import { svgPlus } from '~/ui/icons/svg'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/layout'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { GearsetsTableAdapter } from './gearsets-table.adapter'
import { GearsetLoadoutListComponent } from './loadout'

@Component({
  standalone: true,
  selector: 'nwb-gearsets-page',
  templateUrl: './gearsets-page.component.html',
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    DataTableModule,
    QuicksearchModule,
    NavbarModule,
    IconsModule,
    TooltipModule,
    IonicModule,
    GearsetLoadoutListComponent
  ],
  providers: [GearsetsTableAdapter.provider(), QuicksearchService, GearsetsStore],
  host: {
    class: 'layout-col',
  },
})
export class GearsetsPageComponent implements OnInit {
  protected iconCreate = svgPlus
  protected tags$ = this.store.tags$

  public constructor(
    private store: GearsetsStore,
    protected search: QuicksearchService,
    private dialog: Dialog,
  ) {
    //
  }

  public async ngOnInit() {
    this.store.loadAll()
  }

  protected async createItem() {
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

  protected toggleTag(value: string) {
    this.store.toggleTag(value)
  }
}
