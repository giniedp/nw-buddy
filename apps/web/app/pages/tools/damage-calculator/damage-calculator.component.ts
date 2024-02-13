import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, Injector, Input, OnInit, Output, effect, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgEllipsisVertical } from '~/ui/icons/svg'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, selectSignal } from '~/utils'
import { CtrlDamageConversionComponent } from './ctrl-damage-conversion.component'
import { CtrlOffenderComponent } from './ctrl-offender.component'
import { CtrlStackInputComponent } from './ctrl-stack-input.component'
import { CtrlWeaponCompontnt } from './ctrl-weapon.component'
import { DamageCalculatorState, DamageCalculatorStore, defenderAccessor, offenderAccessor } from './damage-calculator.store'
import { DamageOutputComponent } from './damage-output.component'
import { FloorPipe } from './floor.pipe'
import { CtrlSimpleInputComponent } from './input-control.component'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_GEAR_SCORE } from '@nw-data/common'
import { CtrDefenderComponent } from './ctrl-defender.component'

@Component({
  standalone: true,
  selector: 'nwb-damage-calculator',
  templateUrl: './damage-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CtrlDamageConversionComponent,
    CtrlSimpleInputComponent,
    CtrlStackInputComponent,
    CtrlWeaponCompontnt,
    CtrlOffenderComponent,
    CtrDefenderComponent,
    FloorPipe,
    FormsModule,
    IconsModule,
    InputSliderComponent,
    LayoutModule,
    NwModule,
    TooltipModule,
    DamageOutputComponent,
  ],
  host: {
    class: 'flex flex-col gap-4',
  },
  providers: [DamageCalculatorStore],
})
export class DamageCalculatorComponent implements OnInit {
  private data = inject(NwDataService)
  protected store = inject(DamageCalculatorStore)
  protected iconMore = svgEllipsisVertical
  private injector = inject(Injector)


  @Input()
  public set state(value: DamageCalculatorState) {
    if (!value) {
      return
    }
    this.store.setState(value)
  }

  @Output()
  public stateChange = new EventEmitter<DamageCalculatorState>()

  protected offenderArmorPenetration = offenderAccessor(this.store, 'armorPenetration')

  protected offenderDamageRow = offenderAccessor(this.store, 'damageRow')
  protected offenderDamageCoef = offenderAccessor(this.store, 'damageCoef')
  protected offenderModPvP = offenderAccessor(this.store, 'modPvP')
  protected offenderModAmmo = offenderAccessor(this.store, 'modAmmo')
  protected offenderModCrit = offenderAccessor(this.store, 'modCrit')
  protected offenderModBase = offenderAccessor(this.store, 'modBase')
  protected offenderModBaseConv = offenderAccessor(this.store, 'modBaseConv')
  protected offenderModDMG = offenderAccessor(this.store, 'modDMG')
  protected offenderModDMGConv = offenderAccessor(this.store, 'modDMGConv')

  protected defenderLevel = defenderAccessor(this.store, 'level')
  protected defenderGearScore = defenderAccessor(this.store, 'gearScore')

  protected defenderPhysicalArmor = defenderAccessor(this.store, 'physicalArmor')
  protected defenderPhysicalArmorFortify = defenderAccessor(this.store, 'physicalArmorFortify')
  protected defenderPhysicalArmorAdd = defenderAccessor(this.store, 'physicalArmorAdd')

  protected defenderElementalArmor = defenderAccessor(this.store, 'elementalArmor')
  protected defenderElementalArmorFortify = defenderAccessor(this.store, 'elementalArmorFortify')
  protected defenderElementalArmorAdd = defenderAccessor(this.store, 'elementalArmorAdd')

  protected defenderModABS = defenderAccessor(this.store, 'modABS')
  protected defenderModABSConv = defenderAccessor(this.store, 'modABSConv')
  protected defenderModWKN = defenderAccessor(this.store, 'modWKN')
  protected defenderModWKNConv = defenderAccessor(this.store, 'modWKNConv')
  protected defenderModCritReduction = defenderAccessor(this.store, 'modCritReduction')
  protected defenderModBaseReduction = defenderAccessor(this.store, 'modBaseReduction')
  protected defenderModBaseReductionConv = defenderAccessor(this.store, 'modBaseReductionConv')

  protected levelMin = 1
  protected levelMax = NW_MAX_CHARACTER_LEVEL

  protected gsMin = 0
  protected gsMax = NW_MAX_GEAR_SCORE

  protected attackOptions = selectSignal(
    {
      weaponTag: this.store.offender.weaponTag,
      tables: this.data.damageTables0,
    },
    ({ weaponTag, tables }) => {
      if (!weaponTag || !tables) {
        return []
      }
      const prefix = NW_WEAPON_TYPES.find((it) => it.WeaponTag === this.store.offender.weaponTag())?.DamageTablePrefix
      if (!prefix) {
        return []
      }
      return tables
        .filter((it) => it.DamageID.toLowerCase().startsWith(prefix.toLowerCase()))
        .map((it) => {
          return {
            label: humanize(it.DamageID.replace(prefix, '')),
            value: it.DamageID,
          }
        })
    },
  )

  public constructor() {
    this.store.connectWeaponTag()
    this.store.connectAttributes()
    this.store.connectAffix()
  }

  public ngOnInit(): void {
    effect(() => {
      this.stateChange.emit({
        offender: this.store.offender(),
        defender: this.store.defender(),
      })
    }, {
      injector: this.injector,
    })
  }
}
