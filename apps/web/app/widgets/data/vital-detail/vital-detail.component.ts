import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  selector: 'nwb-vital-detail',
  templateUrl: './vital-detail.component.html',
  exportAs: 'vitalDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, VitalDetailHeaderComponent],
  providers: [VitalDetailStore],
  host: {
    class: 'flex flex-col rounded-md overflow-clip',
  },
})
export class VitalDetailComponent {
  public readonly store = inject(VitalDetailStore)
  public vitalId = input<string>()
  public level = input<number>()
  public mutaElement = input<string>()
  public mutaDifficulty = input<number>()

  public constructor() {
    this.store.load(
      computed(() => {
        return {
          vitalId: this.vitalId(),
          level: this.level(),
        }
      }),
    )
    this.store.setMutation(
      computed(() => {
        return {
          mutaElementId: this.mutaElement(),
          mutaDifficultyId: this.mutaDifficulty(),
        }
      }),
    )
  }
}
