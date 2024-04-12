import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { DomSanitizer } from '@angular/platform-browser'
import { ActivatedRoute, Router } from '@angular/router'
import { environment } from 'apps/web/environments'
import { filter, of, switchMap, throwError } from 'rxjs'
import { SkillBuildsDB, SkillSetRecord } from '~/data'
import { NwModule } from '~/nw'
import { ShareService } from '~/pages/share'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { HtmlHeadService } from '~/utils'
import { suspensify } from '~/utils/rx/suspensify'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillBuilderComponent } from '~/widgets/skill-builder'

@Component({
  standalone: true,
  selector: 'nwb-skill-tree-share',
  templateUrl: './skill-tree-share.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, SkillBuilderComponent, AttributesEditorModule, LayoutModule],
  host: {
    class: 'ion-page',
  },
})
export class SkillBuildsShareComponent {
  protected vm$ = this.route.paramMap.pipe(
    switchMap((it) => {
      if (it.has('cid')) {
        return this.web3.downloadbyCid(it.get('cid'))
      }
      return this.web3.downloadByName(it.get('name'))
    }),
    switchMap((it) => {
      if (it?.type === 'skill-build' && it.data) {
        const record: SkillSetRecord = it.data
        delete record.id
        return of(record)
      }
      return throwError(() => new Error(`invalid data`))
    }),
    suspensify<SkillSetRecord>(),
  )

  protected iconInfo = svgCircleExclamation
  protected iconError = svgCircleExclamation
  protected iconLoading = svgCircleNotch
  protected get appLink() {
    if (environment.standalone) {
      return null
    }
    return this.sanitizer.bypassSecurityTrustUrl(`nw-buddy://${this.router.url}`)
  }

  public constructor(
    private route: ActivatedRoute,
    private router: Router,
    private web3: ShareService,
    private modal: ModalService,
    private db: SkillBuildsDB,
    private sanitizer: DomSanitizer,
    head: HtmlHeadService,
  ) {
    head.updateMetadata({
      title: 'Shared Skill Build',
      description: 'A shared skill build that can be imported into your own collection',
    })
  }

  protected onimportClicked(record: SkillSetRecord) {
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
