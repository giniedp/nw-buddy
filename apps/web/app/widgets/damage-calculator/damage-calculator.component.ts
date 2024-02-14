import { CommonModule } from '@angular/common'
import {
  Attribute,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
  booleanAttribute,
  effect,
  inject,
} from '@angular/core'
import { getState } from '@ngrx/signals'
import { DefenderElementalArmorControlComponent } from './controls/defender-elemental-armor-control.component'
import { DefenderModsControlComponent } from './controls/defender-mods-control.component'
import { DefenderPhysicalArmorControlComponent } from './controls/defender-physical-armor-control.component'
import { DefenderStatsControlComponent } from './controls/defender-stats-control.component'
import { OffenderAttackControlComponent } from './controls/offender-attack-control.component'
import { OffenderConversionControlComponent } from './controls/offender-conversion-control.component'
import { OffenderModsControlComponent } from './controls/offender-mods-control.component'
import { OffenderStatsControlComponent } from './controls/offender-stats-control.component'
import { OffenderWeaponControlComponent } from './controls/offender-weapon-control.component'
import { StackedValueControlComponent } from './controls/stacked-value-control.component'
import { DamageCalculatorState, DamageCalculatorStore } from './damage-calculator.store'
import { DamageOutputComponent } from './damage-output.component'

@Component({
  standalone: true,
  selector: 'nwb-damage-calculator',
  templateUrl: './damage-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    OffenderConversionControlComponent,
    DamageOutputComponent,
    DefenderElementalArmorControlComponent,
    DefenderModsControlComponent,
    DefenderPhysicalArmorControlComponent,
    DefenderStatsControlComponent,
    OffenderAttackControlComponent,
    OffenderModsControlComponent,
    OffenderStatsControlComponent,
    OffenderWeaponControlComponent,
    StackedValueControlComponent,
  ],
  host: {
    class: 'flex flex-col gap-4',
  },
  providers: [DamageCalculatorStore],
})
export class DamageCalculatorComponent implements OnInit {
  private injector = inject(Injector)
  protected store = inject(DamageCalculatorStore)

  @Input()
  public set state(value: DamageCalculatorState) {
    if (!value) {
      return
    }
    this.store.setState(value)
  }

  @Output()
  public stateChange = new EventEmitter<DamageCalculatorState>()

  public constructor(@Attribute('standalone') standalone: string) {
    if (booleanAttribute(standalone)) {
      this.store.connectWeaponTag()
      this.store.connectAttributes()
      this.store.connectAffix()
    }
  }

  public ngOnInit(): void {
    effect(
      () => {
        this.stateChange.emit(getState(this.store))
      },
      {
        injector: this.injector,
      },
    )
  }
}
