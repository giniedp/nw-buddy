import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { filter, switchMap } from 'rxjs'
import { SkillTreesService, SkillTreeRecord } from '~/data'
import { ShareLoaderComponent } from '~/pages/share'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillTreeEditorComponent } from '~/widgets/skill-tree'

@Component({
  selector: 'nwb-skill-tree-share',
  templateUrl: './skill-tree-share.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SkillTreeEditorComponent, AttributesEditorModule, LayoutModule, ShareLoaderComponent],
  host: {
    class: 'ion-page',
  },
})
export class SkillTreeShareComponent {
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private modal = inject(ModalService)
  private store = inject(SkillTreesService)

  protected paramName = toSignal(injectRouteParam('name'))
  protected paramCid = toSignal(injectRouteParam('cid'))
  protected validType = 'skill-build'

  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Shared Skill Build',
      description: 'A shared skill build that can be imported into your own collection',
    })
  }

  protected onImportClicked(record: SkillTreeRecord) {
    record = { ...record, id: null }
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import',
        body: 'New skill-tree name',
        value: record.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((name) => {
          return this.store.create({
            ...record,
            name: name,
          })
        }),
      )
      .subscribe(({ id }) => {
        this.router.navigate(['/skill-trees', id], {
          replaceUrl: true,
          relativeTo: this.route,
        })
      })
  }
}
