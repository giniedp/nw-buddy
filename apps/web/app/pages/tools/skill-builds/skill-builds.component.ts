import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { RouterModule } from '@angular/router'
import { filter } from 'rxjs'
import { SkillBuildRow, SkillBuildsStore } from '~/data'
import { NwModule } from '~/nw'
import { DataTableModule } from '~/ui/data-table'
import { IconsModule } from '~/ui/icons'
import { svgPlus } from '~/ui/icons/svg'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/modal'
import { NavToolbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { SkillWeaponDialogComponent } from '~/widgets/skill-builder/skill-weapon-dialog.component'
import { SkillBuildsTableAdapter } from './skill-builds-table.adapter'

@Component({
  standalone: true,
  selector: 'nwb-skill-builds',
  templateUrl: './skill-builds.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    NwModule,
    DataTableModule,
    QuicksearchModule,
    NavToolbarModule,
    IconsModule,
    TooltipModule,
  ],
  providers: [SkillBuildsTableAdapter.provider(), QuicksearchService, SkillBuildsStore],
  host: {
    class: 'layout-col',
  },
})
export class SkillBuildsComponent {
  protected iconCreate = svgPlus

  public constructor(private store: SkillBuildsStore, protected search: QuicksearchService, private dialog: Dialog) {}

  protected async createItem() {
    SkillWeaponDialogComponent.open(this.dialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: 400,
      maxHeight: 600,
      data: null
    })
    .closed.pipe(filter((it) => !!it))
    .subscribe((weapon) => {
      this.store.createRecord({
        record: {
          id: null,
          name: `New Skill Tree`,
          tree1: null,
          tree2: null,
          weapon: weapon,
        },
      })
    })

    // PromptDialogComponent.open(this.dialog, {
    //   data: {
    //     title: 'Create new skill tree',
    //     body: 'Give this set a name',
    //     input: `New Skill Tree`,
    //     positive: 'Create',
    //     negative: 'Cancel',
    //   },
    // })
    //   .closed.pipe(filter((it) => !!it))
    //   .subscribe((newName) => {
    //     this.store.createRecord({
    //       record: {
    //         id: null,
    //         name: newName,
    //         tree1: null,
    //         tree2: null,
    //         weapon: 'sword',
    //       },
    //     })
    //   })
  }

  protected deleteItem(item: SkillBuildRow) {
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete Skill Tree',
        body: 'Are you sure you want to delete this skill tree?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.store.destroyRecord({ recordId: item.record.id })
      })
  }
}
