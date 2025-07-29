import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, inject, Injector } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_ENEMY_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'
import { filter, switchMap, take } from 'rxjs'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { VitalTableAdapter } from '~/widgets/data/vital-table'
import { DamageCalculatorStore, defenderAccessor, updateDefender } from '../damage-calculator.store'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  selector: 'nwb-defender-stats-control',
  templateUrl: './defender-stats-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    InputSliderComponent,
    LayoutModule,
    IconsModule,
    PrecisionInputComponent,
    TooltipModule,
  ],
  host: {
    class: 'fieldset',
  },
})
export class DefenderStatsControlComponent {
  protected store = inject(DamageCalculatorStore)
  private injector = inject(Injector)
  private db = injectNwData()
  protected iconInfo = svgInfo

  protected isPlayer = defenderAccessor(this.store, 'isPlayer')
  protected vitalId = defenderAccessor(this.store, 'vitalId')
  protected level = defenderAccessor(this.store, 'level')
  protected gearScore = defenderAccessor(this.store, 'gearScore')

  private vitalId$ = toObservable(this.store.defenderVitalId)
  private vital$ = this.vitalId$.pipe(switchMap((it) => this.db.vitalsById(it)))
  protected vitalName = selectSignal(this.vital$, (it) => it?.DisplayName)
  protected levelMin = 1
  protected get levelMax() {
    return this.isPlayer.value ? NW_MAX_CHARACTER_LEVEL : NW_MAX_ENEMY_LEVEL
  }

  protected gsMin = 0
  protected gsMax = NW_MAX_GEAR_SCORE

  protected get isBound() {
    return this.store.defender.isBound()
  }
  protected get isVitalPickable() {
    return !this.isPlayer.value
  }
  protected get isLevelDisabled() {
    return false
  }
  protected get isGsDisabled() {
    return !!this.vitalId.value || this.isBound
  }

  protected pickVital() {
    DataViewPicker.from({
      title: 'Select Vital',
      injector: this.injector,
      dataView: {
        adapter: VitalTableAdapter,
      },
      selection: [this.store.defenderVitalId()],
    })
      .pipe(
        filter((it) => it != null),
        switchMap((it: string[]) => this.db.vitalsById(it[0])),
        take(1),
      )
      .subscribe((vital) => {
        patchState(
          this.store,
          updateDefender({
            vitalId: vital?.VitalsID || null,
            level: vital?.Level || this.levelMin,
          }),
        )
      })
  }

  protected setIsPlayer(value: boolean) {
    this.isPlayer.value = value
    if (value) {
      this.vitalId.value = null
    }
  }
}
