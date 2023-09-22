import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { filter } from 'rxjs'
import { SkillBuildRow, SkillBuildsStore } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgPlus } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/layout'
import { NavbarModule } from '~/ui/nav-toolbar'
import { QuicksearchModule, QuicksearchService } from '~/ui/quicksearch'
import { TooltipModule } from '~/ui/tooltip'
import { HtmlHeadService } from '~/utils'
import { SkillWeaponDialogComponent } from '~/widgets/skill-builder/skill-weapon-dialog.component'
import { SkillTreesListComponent } from './skill-trees-list.component'

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
    NavbarModule,
    IconsModule,
    TooltipModule,
    IonicModule,
    SkillTreesListComponent,
  ],
  providers: [QuicksearchService, SkillBuildsStore],
  host: {
    class: 'layout-col',
  },
})
export class SkillBuildsComponent {
  protected iconCreate = svgPlus

  protected records$ = this.store.records$

  public constructor(
    private store: SkillBuildsStore,
    protected search: QuicksearchService,
    private dialog: Dialog,
    head: HtmlHeadService
  ) {
    head.updateMetadata({
      title: 'Skill Builder',
      description: 'A Skill Buider tool for New World. Build your skill tree and share with your mates.',
    })
  }

  protected async createItem() {
    SkillWeaponDialogComponent.open(this.dialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: 400,
      maxHeight: 600,
      data: null,
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
