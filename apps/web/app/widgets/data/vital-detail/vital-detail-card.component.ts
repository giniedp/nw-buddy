import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Type, computed, inject, input, model } from '@angular/core'
import { outputFromObservable, toObservable } from '@angular/core/rxjs-interop'
import { NwModule } from '~/nw'
import { VitalDetailAttacksComponent } from './vital-detail-attacks.component'
import { VitalDetailBuffsComponent } from './vital-detail-buffs.component'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailModelsComponent } from './vital-detail-models.component'
import { VitalDetailStatsComponent } from './vital-detail-stats.component'
import { VitalDetailStore } from './vital-detail.store'
import { LoadingBarComponent } from '~/widgets/loader'
import { TabsModule } from '~/ui/tabs'

export interface VitalDetailTab {
  id: string
  label: string
  component: Type<any>
}

@Component({
  selector: 'nwb-vital-detail-card',
  templateUrl: './vital-detail-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    VitalDetailHeaderComponent,
    LoadingBarComponent,
    TabsModule,
    VitalDetailStatsComponent,
    VitalDetailAttacksComponent,
    VitalDetailBuffsComponent,
    VitalDetailModelsComponent,
  ],
  providers: [VitalDetailStore],
  host: {
    class: 'block rounded-md overflow-hidden border border-base-100',
    '[class.bg-base-200]': '!hasDarkBg()',
    '[class.bg-black]': 'hasDarkBg()',
  },
})
export class VitalDetailCardComponent {
  protected store = inject(VitalDetailStore)
  public vitalId = input<string>()
  public level = input<number>()
  public mutaElement = input<string>()
  public mutaDifficulty = input<number>()
  public activeTab = model<string>()
  public activeTabChange = outputFromObservable(toObservable(this.activeTab))
  protected hasDarkBg = computed(() => this.activeTab() === 'models')

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
