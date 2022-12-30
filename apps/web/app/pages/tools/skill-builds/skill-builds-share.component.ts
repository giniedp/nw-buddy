import { Dialog } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { LetModule } from '@ngrx/component'
import { filter, map, switchMap } from 'rxjs'
import { SkillBuildRecord, SkillBuildsDB, SkillBuildsStore } from '~/data'
import { NwModule } from '~/nw'
import { ShareService } from '~/pages/share'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { PromptDialogComponent } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillBuilderComponent } from '~/widgets/skill-builder'

@Component({
  standalone: true,
  selector: 'nwb-skill-builds-share',
  templateUrl: './skill-builds-share.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, LetModule, SkillBuilderComponent, AttributesEditorModule],
  host: {
    class: 'layout-content bg-base-300',
  },
})
export class SkillBuildsShareComponent {
  protected cid$ = observeRouteParam(this.route, 'cid')
  protected record$ = this.cid$.pipe(switchMap((cid) => this.web3.readObject(cid))).pipe(
    map((it): SkillBuildRecord => {
      if (it.type === 'skill-build') {
        const record: SkillBuildRecord = it.data
        delete record.id
        return record
      }
      return null
    })
  )

  protected iconInfo = svgCircleExclamation
  protected iconError = svgCircleExclamation
  protected iconLoading = svgCircleNotch

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private web3: ShareService,
    private dialog: Dialog,
    private skillsDb: SkillBuildsDB,
    private store: SkillBuildsStore,
  ) {
    //
  }

  protected onimportClicked(record: SkillBuildRecord) {
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Import',
        body: 'New skill-tree name',
        input: record.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((name) => {
          return this.skillsDb.create({
            ...record,
            name: name,
          })
        })
      )
      .subscribe((record) => {
        this.store.notifyCreated(record)
        this.router.navigate(['../..', record.id], {
          replaceUrl: true,
          relativeTo: this.route,
        })
      })
  }
}
