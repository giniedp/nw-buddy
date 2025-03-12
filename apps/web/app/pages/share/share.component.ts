import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { filter, switchMap } from 'rxjs'
import { SkillBuildsDB, SkillSetRecord } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgShareNodes } from '~/ui/icons/svg'
import { ConfirmDialogComponent, ModalService, PromptDialogComponent } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { suspensify } from '~/utils/rx/suspensify'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillBuilderComponent } from '~/widgets/skill-builder'
import { ShareService } from './share.service'

@Component({
  selector: 'nwb-share-page',
  templateUrl: './share.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, SkillBuilderComponent, IconsModule, AttributesEditorModule],
  host: {
    class: 'layout-content',
  },
})
export class ShareComponent {
  protected iconError = svgCircleExclamation
  protected iconInfo = svgCircleExclamation
  protected iconShare = svgShareNodes

  protected cid$ = observeRouteParam(this.route, 'cid')
  protected data$ = this.cid$.pipe(switchMap((cid) => this.web3.download({ cid })))
  protected state = toSignal(this.data$.pipe(suspensify()))

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private web3: ShareService,
    private modal: ModalService,
    private skillsDb: SkillBuildsDB,
  ) {
    //
  }

  public importSkillBuild(value: SkillSetRecord) {
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Name',
        body: 'Choose a name for this build',
        value: value.name,
        positive: 'OK',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => it != null))
      .pipe(
        switchMap((name) => {
          const record = {
            ...value,
            id: null,
            name: name,
          }
          return this.skillsDb.create(record)
        }),
      )
      .subscribe({
        next: (record) => {
          this.router.navigate(['skill-trees', record.id])
        },
        error: () => {
          ConfirmDialogComponent.open(this.modal, {
            inputs: {
              title: 'Error',
              body: 'Failed to import',
              positive: 'Close',
            },
          })
        },
      })
  }
}
