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
import { getDamageScalingForWeapon, patchPrecision } from '@nw-data/common'
import { BehaviorSubject, EMPTY, combineLatest, map, switchMap } from 'rxjs'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult, describeModifierSource } from '~/nw/mannequin/modifier'
import { IconsModule } from '~/ui/icons'
import { svgRestartAlt } from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
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
import {
  DamageCalculatorState,
  DamageCalculatorStore,
  ValueStack,
  updateDefender,
  updateOffender,
} from './damage-calculator.store'
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
    LayoutModule,
    IconsModule,
    TooltipModule,
  ],
  host: {
    class: 'flex flex-col',
    '[class.gap-4]': '!layoutAsPage',
    '[class.ion-page]': 'layoutAsPage',
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

  @Input()
  public layoutAsPage = false
  protected iconReset = svgRestartAlt

  public constructor(@Attribute('standalone') standalone: string) {
    if (booleanAttribute(standalone)) {
      this.store.connectWeaponTag()
      this.store.connectAttributes()
      this.store.connectAffix()
      this.store.connectVital()
    } else {
      this.store.connectWeaponTag()
      this.store.connectAttributes()
      this.store.connectVital()
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

  protected resetOffender() {
    this.store.resetOffender()
  }

  protected resetDefender() {
    this.store.resetDefender()
  }

  private connectPlayer() {
    this.player$
      .pipe(
        switchMap((mannequin) => {
          if (!mannequin) {
            patchState(this.store, updateOffender({ isBound: false }))
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
            modArmorPenetration: toObservable(mannequin.modArmorPenetration, { injector: this.injector }),
          })
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(
        ({
          level,
          gearScore,
          attributes,
          weapon,
          dmgCoef,
          modBase,
          modConvert,
          modCrit,
          modDMG,
          modPvP,
          modAmmo,
          modArmorPenetration,
        }) => {
          patchState(
            this.store,
            updateOffender({
              isBound: true,
              level: level,
              gearScore: patchPrecision(gearScore),
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
              weaponTag: weapon?.weaponTag,
              weaponDamage: weapon?.weapon?.BaseDamage ?? 0,
              weaponGearScore: weapon?.gearScore ?? 0,
              weaponScaling: getDamageScalingForWeapon(weapon?.weapon),
              weaponDamageType: modBase?.Type,
              damageRow: null,
              damageCoef: dmgCoef?.value ?? 0,
              damageAdd: 0,

              armorPenetration: mergeStack(modArmorPenetration.Base, this.store.offender.armorPenetration()),
              modAmmo: mergeStack(modAmmo, this.store.offender.modAmmo()),
              modPvP: mergeStack(modPvP, this.store.offender.modPvP()),
              modCrit: mergeStack(modCrit.Damage, this.store.offender.modCrit()),
              modBase: mergeStack(modBase.Damage, this.store.offender.modBase()),
              modBaseConv: mergeStack(modConvert.Damage, this.store.offender.modBaseConv()),
              modDMG: mergeStack(modDMG.byDamageType[modBase.Type], this.store.offender.modDMG()),
              modDMGConv: mergeStack(modDMG.byDamageType[modConvert.Type], this.store.offender.modDMGConv()),
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
            patchState(this.store, updateOffender({ isBound: false }))
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
        patchState(
          this.store,
          updateDefender({
            isPlayer: true,
            isBound: true,
            level: level,
            gearScore: patchPrecision(gearScore),
            modABS: mergeStack(modAbs?.DamageCategories[dmgTypeWeapon], this.store.defender.modABS()),
            modABSConv: mergeStack(modAbs?.DamageCategories[dmgTypeConvert], this.store.defender.modABSConv()),
            modWKN: mergeStack(modWKN?.[dmgTypeWeapon], this.store.defender.modWKN()),
            modWKNConv: mergeStack(modWKN?.[dmgTypeConvert], this.store.defender.modWKNConv()),
            // modBaseReduction
            // modBaseReductionConv
            // modCritReduction
            elementalArmor: {
              value: patchPrecision(modArmor?.ElementalBase?.armorRating ?? 0, 1),
              stack: this.store.defender.elementalArmor().stack,
            },
            elementalArmorAdd: {
              value: patchPrecision(modArmor?.ElementalBase?.weaponRating ?? 0, 1),
              stack: this.store.defender.elementalArmorAdd().stack,
            },
            elementalArmorFortify: mergeStack(modArmor?.Elemental, this.store.defender.elementalArmorFortify()),
            physicalArmor: {
              value: patchPrecision(modArmor?.PhysicalBase?.armorRating ?? 0, 1),
              stack: this.store.defender.physicalArmor().stack,
            },
            physicalArmorAdd: {
              value: patchPrecision(modArmor?.PhysicalBase?.weaponRating ?? 0, 1),
              stack: this.store.defender.physicalArmorAdd().stack,
            },
            physicalArmorFortify: mergeStack(modArmor?.Physical, this.store.defender.physicalArmorFortify()),
          }),
        )
      })
  }
}

function mergeStack(mod: ModifierResult, oldStack: ValueStack): ValueStack {
  const ids: Record<string, number> = {}

  function getId(label: string, limit: number) {
    const result = `${label} - ${limit ?? ''}`
    const count = ids[result] || 0
    ids[result] = count + 1
    return `${result} - ${count}`
  }

  const result: ValueStack = {
    value: oldStack?.value || 0,
    stack: [],
  }

  for (const it of mod?.source || []) {
    const source = describeModifierSource(it.source)
    const id = getId(source.label, it.limit)
    result.stack.push({
      value: patchPrecision(it.value * it.scale),
      cap: it.limit ?? null,
      label: source.label,
      icon: source.icon,
      tag: id,
    })
  }

  for (const it of oldStack?.stack || []) {
    if (!it.tag) {
      result.stack.push(it)
      continue
    }
    const found = result.stack.find((it) => it.tag === it.tag)
    if (found) {
      found.disabled = it.disabled
    }
  }

  return result
}

function toStack(mod: ModifierResult): ValueStack {
  if (!mod) {
    return {
      value: 0,
      stack: [],
    }
  }
  return {
    value: 0,
    stack: mod.source.map((it) => {
      const source = describeModifierSource(it.source)
      return {
        value: patchPrecision(it.value * it.scale),
        cap: it.limit ?? null,
        label: source.label,
        icon: source.icon,
      }
    }),
  }
}
