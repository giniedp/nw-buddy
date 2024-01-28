import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { of, switchMap, throwError } from 'rxjs'
import { SkillSetRecord } from '~/data'
import { NwModule } from '~/nw'
import { ShareService } from '~/pages/share'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { EmbedHeightDirective } from '~/utils/directives/embed-height.directive'
import { suspensify } from '~/utils/rx/suspensify'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillBuilderComponent } from '~/widgets/skill-builder'

@Component({
  standalone: true,
  selector: 'nwb-skill-tree-embed',
  templateUrl: './skill-tree-embed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, FormsModule, IconsModule, SkillBuilderComponent, AttributesEditorModule, EmbedHeightDirective],
  hostDirectives: [EmbedHeightDirective],
  host: {
    class: 'layout-col bg-base-300',
  },
})
export class SkillBuildsEmbedComponent {

  protected vm$ = this.route.paramMap
    .pipe(
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
      suspensify<SkillSetRecord>()
    )
  protected vm = toSignal(this.vm$, { initialValue: undefined })

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
