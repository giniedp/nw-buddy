import { Dialog } from '@angular/cdk/dialog'
import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import {
  Component,
  InjectionToken,
  Injector,
  Pipe,
  PipeTransform,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { damageScaleAttrs } from '@nw-data/common'
import { combineLatest, filter, map, take } from 'rxjs'
import { GearsetSignalStore, GearsetsDB, NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { CollapsibleComponent } from '~/ui/collapsible'
import { DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft, svgEllipsisVertical } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'
import { GearsetTableAdapter } from '~/widgets/data/gearset-table'
import { VitalTableAdapter, VitalTableRecord } from '~/widgets/data/vital-table'
import { DamageCalculatorStore } from './damage-calculator.store'
import { LabelControlComponent } from './label-control.component'
import { TweakControlComponent } from './tweak-control.component'

const DEFENDER_MANNEQUIN = new InjectionToken<Mannequin>('DEFENDER_MANNEQUIN')
const DEFENDER_GEARSET = new InjectionToken<GearsetSignalStore>('DEFENDER_GEARSET')
@Pipe({ standalone: true, name: 'floor' })
export class FloorPipe implements PipeTransform {
  public transform(value: number): number {
    return Math.floor(value)
  }
}

@Component({
  standalone: true,
  selector: 'nwb-damage-calculator',
  templateUrl: './damage-calculator.component.html',
  providers: [
    DamageCalculatorStore,
    FloorPipe,
    {
      provide: DEFENDER_MANNEQUIN,
      useClass: Mannequin,
    },
    {
      provide: DEFENDER_GEARSET,
      useClass: GearsetSignalStore,
    },
  ],
  imports: [
    CommonModule,
    NwModule,
    CdkMenuModule,
    FormsModule,
    IconsModule,
    TooltipModule,
    TweakControlComponent,
    LabelControlComponent,
    FloorPipe,
    CollapsibleComponent,
  ],
  host: {
    class: 'layout-content',
  },
})
export class DamageCalculatorComponent {
  protected store = inject(DamageCalculatorStore)
  private db = inject(NwDataService)
  private gearDb = inject(GearsetsDB)
  private mannequin = inject(Mannequin)
  private dialog = inject(Dialog)
  private injector = inject(Injector)
  protected svgChevronLeft = svgChevronLeft
  protected svgMore = svgEllipsisVertical
  private defender = signal<{ isGearset: boolean; id: string }>(null)
  private defenderGearsetId = computed(() => (this.defender()?.isGearset ? this.defender()?.id : null))
  private defenderVitalId = computed(() => (this.defender()?.isGearset ? null : this.defender()?.id))
  private defenderVital$ = this.db.vital(toObservable(this.defenderVitalId))
  private defenderGearset$ = this.gearDb.observeByid(toObservable(this.defenderVitalId))
  private defenderMannequin = inject(DEFENDER_MANNEQUIN)
  private defenderGearset = inject(DEFENDER_GEARSET)

  public constructor() {
    const SESSION_KEY = 'damage-calculator'
    const session = sessionStorage.getItem(SESSION_KEY)
    if (session) {
      try {
        patchState(this.store, JSON.parse(session))
      } catch (e) {
        console.error(e)
      }
    }
    effect(() => {
      const data = JSON.stringify({
        attackerLevelTweak: this.store.attackerLevelTweak(),
        attackerGearScoreTweak: this.store.attackerGearScoreTweak(),
        weaponGearScoreTweak: this.store.weaponGearScoreTweak(),
        defenderCreature: this.store.defenderCreature(),
        defenderIsPlayer: this.store.defenderIsPlayer(),
        baseDamageTweak: this.store.baseDamageTweak(),
        damageCoefTweak: this.store.damageCoefTweak(),
        pvpModsTweak: this.store.pvpModsTweak(),
        baseModsTweak: this.store.baseModsTweak(),
        critModsTweak: this.store.critModsTweak(),
        empowerModsTweak: this.store.empowerModsTweak(),
        convertBaseModsTweak: this.store.convertBaseModsTweak(),
        convertEmpowerModsTweak: this.store.convertEmpowerModsTweak(),
        ammoModsTweak: this.store.ammoModsTweak(),
        armorPenetrationTweak: this.store.armorPenetrationTweak(),
        defenderLevelTweak: this.store.defenderLevelTweak(),
        defenderGearScoreTweak: this.store.defenderGearScoreTweak(),
        defenderArmorPhysTweak: this.store.defenderArmorPhysTweak(),
        defenderArmorElemTweak: this.store.defenderArmorElemTweak(),
        defenderArmorPhysFortTweak: this.store.defenderArmorPhysFortTweak(),
        defenderArmorElemFortTweak: this.store.defenderArmorElemFortTweak(),
        defenderArmorPhysAddTweak: this.store.defenderArmorPhysAddTweak(),
        defenderArmorElemAddTweak: this.store.defenderArmorElemAddTweak(),
        defenderABSWeaponTweak: this.store.defenderABSWeaponTweak(),
        defenderABSConvertedTweak: this.store.defenderABSConvertedTweak(),
        defenderWKNWeaponTweak: this.store.defenderWKNWeaponTweak(),
        defenderWKNConvertedTweak: this.store.defenderWKNConvertedTweak(),
      })
      sessionStorage.setItem(SESSION_KEY, data)
    })

    combineLatest({
      level: this.mannequin.level$,
      gearScore: this.mannequin.gearScore$,
      weapon: this.mannequin.activeWeapon$,
      damage: this.mannequin.statDamageBase$,
      empowerMods: this.mannequin.statDmg$,
      attributes: this.mannequin.activeAttributes$,
    })
      .pipe(takeUntilDestroyed())
      .subscribe(({ level, gearScore, weapon, damage, empowerMods, attributes }) => {
        patchState(this.store, {
          attackerLevel: level,
          attackerGearScore: gearScore,
          attributes: {
            str: attributes.str.scale,
            dex: attributes.dex.scale,
            int: attributes.int.scale,
            foc: attributes.foc.scale,
            con: attributes.con.scale,
          },
          convertScaling: damageScaleAttrs(damage.ConvertAffix),
          weaponGearScore: weapon.gearScore,
          weaponScaling: damageScaleAttrs(weapon.weapon),
          baseDamage: weapon.weapon?.BaseDamage ?? 0,
          damageCoef: damage.DamageCoef?.value ?? 0,
          pvpMods: damage.ModPvp?.value ?? 0,
          ammoMods: damage.ModAmmo?.value ? damage.ModAmmo?.value - 1 : 0,
          baseMods: damage.ModBase?.value ?? 0,
          convertBaseMods: damage.ModBaseConvert?.value ?? 0,
          critMods: damage.ModCrit?.value ?? 0,

          weaponDamageType: damage.DamageType,
          convertDamageType: damage.ConvertType,

          empowerMods: empowerMods.DamageCategories[damage.DamageType]?.value ?? 0,
          convertEmpowerMods: empowerMods.DamageCategories[damage.ConvertType]?.value ?? 0,

          convertPercent: damage.ConvertPercent,
        })
      })

    this.defenderVital$
      .pipe(filter((it) => !!it))
      .pipe(takeUntilDestroyed())
      .subscribe((vital) => {
        this.store.setVitalDefender(vital)
      })
  }

  public pickVitalDefender() {
    DataViewPicker.open<VitalTableRecord>(this.dialog, {
      title: 'Pick Vital Defender',
      selection: [this.store.defenderCreature()?.VitalsID].filter((it) => !!it),
      dataView: {
        adapter: VitalTableAdapter,
      },
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(
        map((it) => it?.[0]),
        filter((it) => !!it),
        take(1),
      )
      .subscribe((result) => {
        patchState(this.store, {
          defenderIsPlayer: false,
        })
        this.defender.set({
          isGearset: false,
          id: String(result),
        })
      })
  }

  public pickGearset() {
    DataViewPicker.open(this.dialog, {
      title: 'Pick Opponent Gearset',
      selection: [this.defenderGearsetId()],
      dataView: {
        adapter: GearsetTableAdapter,
      },
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(
        map((it) => it?.[0]),
        filter((it) => !!it),
        take(1),
      )
      .subscribe((result) => {
        patchState(this.store, {
          defenderIsPlayer: true,
        })
        this.defender.set({
          isGearset: true,
          id: String(result),
        })
      })
  }

  public setPvPMode() {
    patchState(this.store, {
      defenderIsPlayer: true,
    })
    this.defender.set({
      isGearset: false,
      id: null,
    })
  }

  public setPvEMode() {
    patchState(this.store, {
      defenderIsPlayer: false,
    })
    this.defender.set({
      isGearset: false,
      id: null,
    })
  }
}
