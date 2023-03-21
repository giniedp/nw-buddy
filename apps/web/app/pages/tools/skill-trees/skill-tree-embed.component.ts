import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetModule } from '@ngrx/component'
import { of, switchMap, throwError } from 'rxjs'
import { SkillBuildRecord } from '~/data'
import { NwModule } from '~/nw'
import { ShareService } from '~/pages/share'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { HtmlHeadService, observeRouteParam } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillBuilderComponent } from '~/widgets/skill-builder'

@Component({
  standalone: true,
  selector: 'nwb-skill-tree-embed',
  templateUrl: './skill-tree-embed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, LetModule, SkillBuilderComponent, AttributesEditorModule],
  host: {
    class: 'layout-content bg-base-300',
  },
})
export class SkillBuildsEmbedComponent {
  protected cid$ = observeRouteParam(this.route, 'cid')
  protected record$ = this.cid$.pipe(switchMap((cid) => this.web3.readObject(cid))).pipe(
    switchMap((it) => {
      if (it?.type === 'skill-build' && it.data) {
        const record: SkillBuildRecord = it.data
        delete record.id
        return of(record)
      }
      return throwError(() => new Error(`invalid data`))
    })
  )

  protected iconInfo = svgCircleExclamation
  protected iconError = svgCircleExclamation
  protected iconLoading = svgCircleNotch

  public constructor(private route: ActivatedRoute, private web3: ShareService, head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Shared Skill Build',
      description: 'A shared skill build that can be imported into your own collection',
    })
  }
}
