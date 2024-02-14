import { CommonModule } from '@angular/common'
import {
  Attribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  Injector,
  Input,
  OnInit,
  Output,
  booleanAttribute,
  effect,
  inject,
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { getState, patchState } from '@ngrx/signals'
import { BehaviorSubject, EMPTY, combineLatest, map, switchMap } from 'rxjs'
import { Mannequin } from '~/nw/mannequin'
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
import { DamageCalculatorState, DamageCalculatorStore, ValueStack, updateDefender, updateOffender } from './damage-calculator.store'
import { DamageOutputComponent } from './damage-output.component'
import { getDamageScalingForWeapon } from '@nw-data/common'
import { ModifierResult, describeModifierSource, modifierResult } from '~/nw/mannequin/modifier'

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
  private destroyRef = inject(DestroyRef)
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

  public constructor(@Attribute('standalone') standalone: string) {
    if (booleanAttribute(standalone)) {
      this.connectState()
    } else {
      this.connectPlayer()
      this.connectOpponent()
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

  private connectState() {
    this.store.connectWeaponTag()
    this.store.connectAttributes()
    this.store.connectAffix()
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(
        ({ level, gearScore, attributes, weapon, dmgCoef, modBase, modConvert, modCrit, modDMG, modPvP, modAmmo }) => {
          patchState(
            this.store,
            updateOffender({
              level: level,
              gearScore: gearScore,
              attributePoints: {
                str: attributes?.str?.total,
                dex: attributes?.dex?.total,
                int: attributes?.int?.total,
                foc: attributes?.foc?.total,
                con: attributes?.con?.total,
              },
              attributeModSums: {
                str: attributes?.str?.scale,
                dex: attributes?.dex?.scale,
                int: attributes?.int?.scale,
                foc: attributes?.foc?.scale,
                con: attributes?.con?.scale,
              },
              convertAffix: modConvert?.Affix?.StatusID,
              convertScaling: getDamageScalingForWeapon(modConvert?.Affix),
              convertDamageType: modConvert?.Type,
              convertPercent: modConvert?.Percent ?? 0,
              weaponTag: null,
              weaponDamage: weapon?.weapon?.BaseDamage ?? 0,
              weaponGearScore: weapon?.gearScore ?? 0,
              weaponScaling: getDamageScalingForWeapon(weapon?.weapon),
              weaponDamageType: modBase?.Type,
              damageRow: null,
              damageCoef: dmgCoef?.value ?? 0,
              damageAdd: 0,

              modAmmo: toStack(modAmmo),
              modPvP: toStack(modPvP),
              modCrit: toStack(modCrit.Damage),
              modBase: toStack(modBase.Damage),
              modBaseConv: toStack(modConvert.Damage),
              modDMG: toStack(modDMG.byDamageType[modBase.Type]),
              modDMGConv: toStack(modDMG.byDamageType[modConvert.Type]),

              // armorPenetration:
            }),
          )
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
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ dmgTypeWeapon, dmgTypeConvert, level, gearScore, modAbs, modWKN, modArmor }) => {
        patchState(this.store, updateDefender({
          level: level,
          gearScore: gearScore,
          modABS: toStack(modAbs?.DamageCategories[dmgTypeWeapon]),
          modABSConv: toStack(modAbs?.DamageCategories[dmgTypeConvert]),
          modWKN: toStack(modWKN?.[dmgTypeWeapon]),
          modWKNConv: toStack(modWKN?.[dmgTypeConvert]),
          // modBaseReduction
          // modBaseReductionConv
          // modCritReduction
          elementalArmor: {
            value: modArmor?.ElementalBase?.armorRating ?? 0,
            stack: []
          },
          elementalArmorAdd: {
            value: modArmor?.ElementalBase?.weaponRating ?? 0,
            stack: []
          },
          elementalArmorFortify: toStack(modArmor?.Elemental),
          physicalArmor: {
            value: modArmor?.PhysicalBase?.armorRating ?? 0,
            stack: []
          },
          physicalArmorAdd: {
            value: modArmor?.PhysicalBase?.weaponRating ?? 0,
            stack: []
          },
          physicalArmorFortify: toStack(modArmor?.Physical),
        }))
      })
  }
}

function toStack(mod: ModifierResult): ValueStack {
  if (!mod) {
    return {
      value: 0,
      stack: []
    }
  }
  return {
    value: mod.value,
    stack: mod.source.map((it) => {
      const source = describeModifierSource(it.source)
      return {
        value: it.value * it.scale,
        cap: it.limit ?? null,
        label: source.label,
        icon: source.icon,
      }
    })
  }
}
