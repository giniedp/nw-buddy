import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, resource } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { filter, switchMap } from 'rxjs'
import { SkillTreeRecord, SkillTreesService } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgShareNodes } from '~/ui/icons/svg'
import { ConfirmDialogComponent, ModalService, PromptDialogComponent } from '~/ui/layout'
import { observeRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillTreeEditorComponent } from '~/widgets/skill-tree'
import { ShareService } from './share.service'

@Component({
  selector: 'nwb-share-page',
  templateUrl: './share.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, SkillTreeEditorComponent, IconsModule, AttributesEditorModule],
  host: {
    class: 'layout-content',
  },
})
export class ShareComponent {
  protected iconError = svgCircleExclamation
  protected iconInfo = svgCircleExclamation
  protected iconShare = svgShareNodes

  private cid = toSignal(observeRouteParam(this.route, 'cid'))
  private resource = resource({
    params: this.cid,
    loader: ({ params }) => {
      return this.web3.download({ cid: params })
    }
  })
  public isLoading = this.resource.isLoading
  public error = this.resource.error
  public value = this.resource.value

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private web3: ShareService,
    private modal: ModalService,
    private skillsStore: SkillTreesService,
  ) {
    //
  }

  public importSkillBuild(value: SkillTreeRecord) {
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
          return this.skillsStore.create({
            ...value,
            id: null,
            name: name,
          })
        }),
      )
      .subscribe({
        next: ({ userId, id }) => {
          this.router.navigate(['skill-trees', userId, id])
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
