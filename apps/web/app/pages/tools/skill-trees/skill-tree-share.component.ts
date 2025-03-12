import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { filter, switchMap } from 'rxjs'
import { SkillBuildsDB, SkillSetRecord } from '~/data'
import { ShareLoaderComponent } from '~/pages/share'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillBuilderComponent } from '~/widgets/skill-builder'

@Component({
  selector: 'nwb-skill-tree-share',
  templateUrl: './skill-tree-share.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SkillBuilderComponent, AttributesEditorModule, LayoutModule, ShareLoaderComponent],
  host: {
    class: 'ion-page',
  },
})
export class SkillBuildsShareComponent {
  protected paramName = toSignal(injectRouteParam('name'))
  protected paramCid = toSignal(injectRouteParam('cid'))
  protected validType = 'skill-build'

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modal: ModalService,
    private db: SkillBuildsDB,
    head: HtmlHeadService,
  ) {
    head.updateMetadata({
      title: 'Shared Skill Build',
      description: 'A shared skill build that can be imported into your own collection',
    })
  }

  protected onImportClicked(record: SkillSetRecord) {
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
          return this.db.create({
            ...record,
            name: name,
          })
        }),
      )
      .subscribe((record) => {
        this.router.navigate(['/skill-trees', record.id], {
          replaceUrl: true,
          relativeTo: this.route,
        })
      })
  }
}
