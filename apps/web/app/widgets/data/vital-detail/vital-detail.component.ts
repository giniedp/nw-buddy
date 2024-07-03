import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailStore } from './vital-detail.store'

@Component({
  standalone: true,
  selector: 'nwb-vital-detail',
  templateUrl: './vital-detail.component.html',
  exportAs: 'vitalDetail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    VitalDetailHeaderComponent
  ],
  providers: [VitalDetailStore],
  host: {
    class: 'flex flex-col rounded-md overflow-clip',
  },
})
export class VitalDetailComponent {
  public readonly store = inject(VitalDetailStore)

  @Input({ required: true })
  public set vitalId(value: string) {
    patchState(this.store, { vitalId: value })
  }

  @Input()
  public set level(value: number) {
    patchState(this.store, { levelOverride: value })
  }

  @Input()
  public set mutaElement(value: string) {
    patchState(this.store, { mutaElementId: value })
  }

  @Input()
  public set mutaDifficulty(value: number) {
    patchState(this.store, { mutaDifficultyId: value })
  }
}
