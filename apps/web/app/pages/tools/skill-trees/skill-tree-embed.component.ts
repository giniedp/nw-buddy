import { ChangeDetectionStrategy, Component } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ShareLoaderComponent } from '~/pages/share'
import { HtmlHeadService, injectRouteParam } from '~/utils'
import { EmbedHeightDirective } from '~/utils/directives/embed-height.directive'
import { AttributesEditorModule } from '~/widgets/attributes-editor'
import { SkillTreeEditorComponent } from '~/widgets/skill-tree'

@Component({
  selector: 'nwb-skill-tree-embed',
  templateUrl: './skill-tree-embed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SkillTreeEditorComponent, AttributesEditorModule, ShareLoaderComponent],
  hostDirectives: [EmbedHeightDirective],
  host: {
    class: 'layout-col bg-base-300',
  },
})
export class SkillTreeEmbedComponent {
  protected paramName = toSignal(injectRouteParam('name'))
  protected paramCid = toSignal(injectRouteParam('cid'))
  protected validType = 'skill-build'

  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Shared Skill Build',
      description: 'A shared skill build that can be imported into your own collection',
    })
  }
}
