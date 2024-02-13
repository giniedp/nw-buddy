import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { Component, Injector, Input, Pipe, PipeTransform, computed, effect, inject, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { getDamageScalingForWeapon } from '@nw-data/common'
import { BehaviorSubject, EMPTY, combineLatest, map, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
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
import { IonContent, IonFooter } from '@ionic/angular/standalone'
import { LayoutModule } from '~/ui/layout'

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
  providers: [DamageCalculatorStore, FloorPipe],
  imports: [
    CommonModule,
    NwModule,
    CdkMenuModule,
    FormsModule,
    LayoutModule,
    IconsModule,
    TooltipModule,
    TweakControlComponent,
    LabelControlComponent,
    FloorPipe,
    CollapsibleComponent,
  ],
  host: {
    class: 'ion-page'
  }
})
export class DamageCalculatorComponent {
  protected store = inject(DamageCalculatorStore)
  private db = inject(NwDataService)

  private injector = inject(Injector)
  protected svgChevronLeft = svgChevronLeft
  protected svgMore = svgEllipsisVertical
  private defender = signal<{ isGearset: boolean; id: string }>(null)
  private defenderGearsetId = computed(() => (this.defender()?.isGearset ? this.defender()?.id : null))
  private defenderVitalId = computed(() => (this.defender()?.isGearset ? null : this.defender()?.id))
  private defenderVital$ = this.db.vital(toObservable(this.defenderVitalId))

  private player$ = new BehaviorSubject<Mannequin>(null)
  @Input()
  public set player(value: Mannequin) {
    this.player$.next(value)
  }

  private opponent$ = new BehaviorSubject<Mannequin>(null)
  @Input()
  public set opponent(value: Mannequin) {
    this.opponent$.next(value)
  }

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
    this.connectPlayer()
    this.connectOpponent()
  }

  public async pickVitalDefender() {
    const result = await DataViewPicker.open<VitalTableRecord>({
      title: 'Pick Vital Defender',
      selection: [this.store.defenderCreature()?.VitalsID].filter((it) => !!it),
      dataView: {
        adapter: VitalTableAdapter,
      },
      injector: this.injector,
    })
    if (!result) {
      return
    }
    patchState(this.store, {
      defenderIsPlayer: false,
    })
    this.defender.set({
      isGearset: false,
      id: String(result),
    })
  }

  public async pickGearset() {
    const result = await DataViewPicker.open({
      title: 'Pick Opponent Gearset',
      selection: [this.defenderGearsetId()],
      dataView: {
        adapter: GearsetTableAdapter,
      },
      injector: this.injector,
    })
    if (!result) {
      return
    }
    patchState(this.store, {
      defenderIsPlayer: true,
    })
    this.defender.set({
      isGearset: true,
      id: String(result),
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

  private connectPlayer() {
    this.player$
      .pipe(
        switchMap((mannequin) => {
          if (!mannequin) {
            return EMPTY
          }
          return combineLatest({
            level: toObservable(mannequin.level, { injector: this.injector }),
            gearScore: toObservable(mannequin.gearScore, { injector: this.injector }),
            attributes: toObservable(mannequin.activeAttributes, { injector: this.injector }),
            weapon: toObservable(mannequin.activeWeapon, { injector: this.injector }),
            dmgCoef: toObservable(mannequin.modDmgCoef, { injector: this.injector }),
            modBase: toObservable(mannequin.modBaseDamage, { injector: this.injector }),
            modConvert: toObservable(mannequin.modBaseConversion, { injector: this.injector }),
            modCrit: toObservable(mannequin.modCrit, { injector: this.injector }),
            modDMG: toObservable(mannequin.modDMG, { injector: this.injector }),
            modPvP: toObservable(mannequin.modPvP, { injector: this.injector }),
            modAmmo: toObservable(mannequin.modAmmo, { injector: this.injector }),
          })
        }),
        takeUntilDestroyed(),
      )
      .subscribe(
        ({ level, gearScore, attributes, weapon, dmgCoef, modBase, modConvert, modCrit, modDMG, modPvP, modAmmo }) => {
          patchState(this.store, {
            attackerLevel: level,
            attackerGearScore: gearScore,
            attributes: {
              str: attributes?.str?.scale,
              dex: attributes?.dex?.scale,
              int: attributes?.int?.scale,
              foc: attributes?.foc?.scale,
              con: attributes?.con?.scale,
            },
            convertScaling: getDamageScalingForWeapon(modConvert?.Affix),
            weaponGearScore: weapon?.gearScore,
            weaponScaling: getDamageScalingForWeapon(weapon?.weapon),
            baseDamage: weapon?.weapon?.BaseDamage ?? 0,
            damageCoef: dmgCoef?.value ?? 0,
            pvpMods: modPvP?.value ?? 0,
            ammoMods: modAmmo?.value ? modAmmo.value - 1 : 0,
            critMods: modCrit?.Damage.value ?? 0,
            baseMods: modBase?.Damage.value ?? 0,
            convertBaseMods: modConvert?.Damage.value ?? 0,

            weaponDamageType: modBase?.Type,
            convertDamageType: modConvert?.Type,

            empowerMods: modDMG?.byDamageType[modBase.Type]?.value ?? 0,
            convertEmpowerMods: modDMG?.byDamageType[modConvert.Type]?.value ?? 0,

            convertPercent: modConvert?.Percent,
          })
        },
      )
  }

  private connectOpponent() {
    combineLatest({
      player: this.player$,
      opponent: this.opponent$,
    })
      .pipe(
        switchMap(({ player, opponent }) => {
          if (!player || !opponent) {
            return EMPTY
          }
          const dmgTypeWeapon$ = toObservable(player.modBaseDamage, { injector: this.injector }).pipe(
            map((it) => it?.Type),
          )
          const dmgTypeConvert$ = toObservable(player.modBaseConversion, { injector: this.injector }).pipe(
            map((it) => it?.Type),
          )
          return combineLatest({
            dmgTypeWeapon: dmgTypeWeapon$,
            dmgTypeConvert: dmgTypeConvert$,
            level: toObservable(opponent.level, { injector: this.injector }),
            gearScore: toObservable(opponent.gearScore, { injector: this.injector }),
            modAbs: toObservable(opponent.modABS, { injector: this.injector }),
            modWKN: toObservable(opponent.modWKN, { injector: this.injector }),
            modArmor: toObservable(opponent.modArmor, { injector: this.injector }),
          })
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ dmgTypeWeapon, dmgTypeConvert, level, gearScore, modAbs, modWKN, modArmor }) => {
        this.store.setDefenderStats({
          defenderLevel: level,
          defenderGearScore: gearScore,
          defenderIsPlayer: true,
          defenderABSWeapon: modAbs?.DamageCategories[dmgTypeWeapon]?.value ?? 0,
          defenderABSConverted: modAbs?.DamageCategories[dmgTypeConvert]?.value ?? 0,
          defenderWKNWeapon: modWKN?.[dmgTypeWeapon]?.value ?? 0,
          defenderWKNConverted: modWKN?.[dmgTypeConvert]?.value ?? 0,
          defenderArmorPhys: modArmor?.PhysicalBase?.armorRating ?? 0,
          defenderArmorPhysFort: modArmor?.Physical?.value ?? 0,
          defenderArmorPhysAdd: modArmor?.PhysicalBase?.weaponRating ?? 0,
          defenderArmorElem: modArmor?.ElementalBase?.armorRating ?? 0,
          defenderArmorElemFort: modArmor?.Elemental?.value ?? 0,
          defenderArmorElemAdd: modArmor?.ElementalBase?.weaponRating ?? 0,
        })
      })
  }
}
