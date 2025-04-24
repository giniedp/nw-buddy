import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { GameViewerCharacterDirective, GameViewerComponent } from '~/widgets/game-viewer'
import { ModelViewerModule } from '~/widgets/model-viewer'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  selector: 'nwb-vital-detail-models',
  template: ` <nwb-game-viewer [nwGameViewerVital]="store.vitalId()" class="block aspect-square relative" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ModelViewerModule, GameViewerComponent, GameViewerCharacterDirective],
  host: {
    class: 'block',
  },
})
export class VitalDetailModelsComponent {
  protected store = inject(VitalDetailStore)
}
