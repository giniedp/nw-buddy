import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, Type, effect, inject, output, signal, untracked } from '@angular/core'
import { patchState } from '@ngrx/signals'
import { NwModule } from '~/nw'
import { selectSignal } from '~/utils'
import { VitalDetailAttacksComponent } from './vital-detail-attacks.component'
import { VitalDetailBuffsComponent } from './vital-detail-buffs.component'
import { VitalDetailHeaderComponent } from './vital-detail-header.component'
import { VitalDetailModelsComponent } from './vital-detail-models.component'
import { VitalDetailStatsComponent } from './vital-detail-stats.component'
import { VitalDetailStore } from './vital-detail.store'

export interface VitalDetailTab {
  id: string
  label: string
  component: Type<any>
}

@Component({
  standalone: true,
  selector: 'nwb-vital-detail-card',
  templateUrl: './vital-detail-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    VitalDetailHeaderComponent,
    VitalDetailStatsComponent,
    VitalDetailAttacksComponent,
    VitalDetailModelsComponent,
    VitalDetailBuffsComponent,
  ],
  providers: [VitalDetailStore],
  host: {
    class: 'block rounded-md overflow-hidden border border-base-100',
    '[class.bg-base-200]': '!hasDarkBg()',
    '[class.bg-black]': 'hasDarkBg()',
  },
})
export class VitalDetailCardComponent {
  private store = inject(VitalDetailStore)

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

  @Input()
  public set activeTab(value: string) {
    this.currentTab.set(value)
  }

  public activeTabChange = output<string>()

  protected currentTab = signal<string>(null)
  protected hasDarkBg = selectSignal(this.currentTab, (it) => it === 'models')
  protected tabs = selectSignal(this.currentTab, (tab) => {
    return [
      {
        id: 'stats',
        label: 'Stats',
        component: VitalDetailStatsComponent,
      },
      {
        id: 'attacks',
        label: 'Attacks',
        component: VitalDetailAttacksComponent,
      },
      {
        id: 'buffs',
        label: 'Buffs',
        component: VitalDetailBuffsComponent,
      },
      {
        id: 'models',
        label: '3D Model',
        component: VitalDetailModelsComponent,
      },
    ].map((it, i) => {
      return {
        ...it,
        active: (!tab && !i) || it.id === tab,
      }
    })
  })

  public constructor() {
    effect(() => {
      const tab = this.currentTab()
      if (tab) {
        console.log('tab', tab)
        untracked(() => this.activeTabChange.emit(tab))
      }
    })
  }
}
