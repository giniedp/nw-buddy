import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_ENEMY_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'
import { filter } from 'rxjs'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgInfo } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { VitalTableAdapter } from '~/widgets/data/vital-table'
import { DamageCalculatorStore, defenderAccessor } from '../damage-calculator.store'
import { PrecisionInputComponent } from './precision-input.component'

@Component({
  standalone: true,
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
    class: 'form-control',
  },
})
export class DefenderStatsControlComponent {
  protected store = inject(DamageCalculatorStore)
  private injector = inject(Injector)
  private data = inject(NwDataService)
  protected iconInfo = svgInfo

  protected isPlayer = defenderAccessor(this.store, 'isPlayer')
  protected vitalId = defenderAccessor(this.store, 'vitalId')
  protected level = defenderAccessor(this.store, 'level')
  protected gearScore = defenderAccessor(this.store, 'gearScore')
  protected vitalName = selectSignal(this.data.vital(toObservable(this.store.defenderVitalId)), (it) => {
    return it?.DisplayName
  })
  protected levelMin = 1
  protected get levelMax() {
    return this.isPlayer.value ? NW_MAX_CHARACTER_LEVEL : NW_MAX_ENEMY_LEVEL
  }

  protected gsMin = 0
  protected gsMax = NW_MAX_GEAR_SCORE

  protected pickVital() {
    DataViewPicker.from({
      title: 'Select Vital',
      injector: this.injector,
      dataView: {
        adapter: VitalTableAdapter,
      },
      selection: [this.store.defenderVitalId()],
    })
      .pipe(filter((it) => it != null))
      .subscribe((res: string[]) => {
        this.vitalId.value = res[0]
      })
  }

  protected setIsPlayer(value: boolean) {
    this.isPlayer.value = value
    if (value) {
      this.vitalId.value = null
    }
  }
}
