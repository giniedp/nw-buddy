import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, inject } from '@angular/core'
import { NwModule } from '~/nw'
import { ModelViewerModule, ModelsService } from '~/widgets/model-viewer'
import { VitalDetailStore } from './vital-detail.store'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-models',
  templateUrl: './vital-detail-models.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ModelViewerModule],
  host: {
    class: 'block',
  },
})
export class VitalDetailModelsComponent {
  private store = inject(VitalDetailStore)
  private service = inject(ModelsService)

  protected models = toSignal(this.service.byVitalsId(toObservable(this.store.vitalId)))

}
