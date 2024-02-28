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
import { NwDataService } from '~/data'
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
import { OffenderDotControlComponent } from './controls/offender-dot-control.component'
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
    OffenderDotControlComponent,
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
  private data = inject(NwDataService)
  private destroyRef = inject(DestroyRef)
  protected store = inject(DamageCalculatorStore)

  protected get isOffenderBound() {
    return this.store.offender.isBound()
  }

  protected get isDefenderBound() {
    return this.store.defender.isBound()
  }

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
          const vitalCategories$ = this.data
            .vital(toObservable(this.store.defenderVitalId, { injector: this.injector }))
            .pipe(map((it) => it?.VitalsCategories || []))

          return combineLatest({
            level: toObservable(mannequin.level, { injector: this.injector }),
            gearScore: toObservable(mannequin.gearScore, { injector: this.injector }),
            attributes: toObservable(mannequin.activeAttributes, { injector: this.injector }),
            weapon: toObservable(mannequin.activeWeapon, { injector: this.injector }),
            dotType: toObservable(this.store.offenderDotDamageType, { injector: this.injector }),
            damageTable: toObservable(mannequin.activeDamageTableRow, { injector: this.injector }),
            dmgCoef: toObservable(mannequin.modDmgCoef, { injector: this.injector }),
            modBase: toObservable(mannequin.modBaseDamage, { injector: this.injector }),
            modCrit: toObservable(mannequin.modCrit, { injector: this.injector }),
            modDMG: toObservable(mannequin.modDMG, { injector: this.injector }),
            modPvP: toObservable(mannequin.modPvP, { injector: this.injector }),
            modAmmo: toObservable(mannequin.modAmmo, { injector: this.injector }),
            modArmorPenetration: toObservable(mannequin.modArmorPenetration, { injector: this.injector }),
            vitalCategories: vitalCategories$,
            isPvP: toObservable(this.store.defender.isPlayer, { injector: this.injector }),
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
          dotType,
          damageTable,
          dmgCoef,
          modBase,
          modCrit,
          modDMG,
          modPvP,
          modAmmo,
          modArmorPenetration,
          vitalCategories,
          isPvP,
        }) => {
          if (isPvP) {
            vitalCategories = []
          }
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
              affixId: modBase?.Affix?.Affix?.StatusID,
              affixScaling: getDamageScalingForWeapon(modBase?.Affix?.Affix),
              affixDamageType: modBase?.Affix?.Type,
              affixPercent: modBase?.Affix?.Percent ?? 0,
              weaponTag: weapon?.weaponTag,
              weaponDamage: weapon?.weapon?.BaseDamage ?? 0,
              weaponGearScore: weapon?.gearScore ?? 0,
              weaponScaling: getDamageScalingForWeapon(weapon?.weapon),
              weaponDamageType: modBase?.Weapon?.Type,
              damageRow: null,
              damageCoef: dmgCoef?.value ?? 0,
              damageAdd: damageTable?.AddDmg ?? 0,

              armorPenetration: mergeStack(modArmorPenetration.Base, this.store.offender.armorPenetration()),
              modAmmo: mergeStack(modAmmo, this.store.offender.modAmmo()),
              modPvP: mergeStack(modPvP, this.store.offender.modPvP()),
              modCrit: mergeStack(modCrit.Damage, this.store.offender.modCrit()),
              modBase: mergeStack(modBase.Weapon?.Damage, this.store.offender.modBase()),
              modBaseAffix: mergeStack(modBase?.Affix?.Damage, this.store.offender.modBaseAffix()),
              modBaseDot: mergeStack(modBase?.Base?.[dotType], this.store.offender.modBaseDot()),
              modDMG: mergeStack(
                [
                  modDMG.byDamageType[modBase.Weapon?.Type],
                  ...vitalCategories.map((category) => modDMG.byVitalsType[category] || []),
                ],
                this.store.offender.modDMG(),
              ),
              modDMGAffix: mergeStack(modDMG.byDamageType[modBase?.Affix?.Type], this.store.offender.modDMGAffix()),
              modDMGDot: mergeStack(modDMG.byDamageType[dotType], this.store.offender.modDMGDot()),
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
            patchState(this.store, updateDefender({ isBound: false }))
            return EMPTY
          }
          const dmgTypeWeapon$ = toObservable(player.modBaseDamage, { injector: this.injector }).pipe(
            map((it) => it?.Weapon?.Type),
          )
          const dmgTypeConvert$ = toObservable(player.modBaseDamage, { injector: this.injector }).pipe(
            map((it) => it?.Affix?.Type),
          )
          const dmgTypeDot$ = toObservable(this.store.offenderDotDamageType, { injector: this.injector })
          return combineLatest({
            dmgTypeWeapon: dmgTypeWeapon$,
            dmgTypeAffix: dmgTypeConvert$,
            dmgTypeDot: dmgTypeDot$,
            level: toObservable(opponent.level, { injector: this.injector }),
            gearScore: toObservable(opponent.gearScore, { injector: this.injector }),
            modAbs: toObservable(opponent.modABS, { injector: this.injector }),
            modWKN: toObservable(opponent.modWKN, { injector: this.injector }),
            modArmor: toObservable(opponent.modArmor, { injector: this.injector }),
            modCrit: toObservable(opponent.modCrit, { injector: this.injector }),
            modBase: toObservable(opponent.modBaseDamage, { injector: this.injector }),
          })
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(
        ({ dmgTypeWeapon, dmgTypeAffix, dmgTypeDot, level, gearScore, modAbs, modWKN, modCrit, modBase, modArmor }) => {
          patchState(
            this.store,
            updateDefender({
              isPlayer: true,
              isBound: true,
              level: level,
              gearScore: patchPrecision(gearScore),
              modABS: mergeStack(modAbs?.DamageCategories[dmgTypeWeapon], this.store.defender.modABS()),
              modABSAffix: mergeStack(modAbs?.DamageCategories[dmgTypeAffix], this.store.defender.modABSAffix()),
              modABSDot: mergeStack(modAbs?.DamageCategories[dmgTypeDot], this.store.defender.modABSDot()),
              modWKN: mergeStack(modWKN?.[dmgTypeWeapon], this.store.defender.modWKN()),
              modWKNAffix: mergeStack(modWKN?.[dmgTypeAffix], this.store.defender.modWKNAffix()),
              modWKNDot: mergeStack(modWKN?.[dmgTypeDot], this.store.defender.modWKNDot()),
              modBaseReduction: mergeStack(modBase?.Reduction?.[dmgTypeWeapon], this.store.defender.modBaseReduction()),
              modBaseReductionAffix: mergeStack(
                modBase?.Reduction?.[dmgTypeAffix],
                this.store.defender.modBaseReduction(),
              ),
              modBaseReductionDot: mergeStack(modBase?.Reduction?.[dmgTypeDot], this.store.defender.modBaseReduction()),
              modCritReduction: mergeStack(modCrit?.DamageReduction, this.store.defender.modCritReduction()),
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
        },
      )
  }
}

function mergeStack(mod: ModifierResult | ModifierResult[], oldStack: ValueStack): ValueStack {
  const ids: Record<string, number> = {}

  function getId(index: number, label: string, limit: number) {
    const result = `${label} - ${limit ?? ''} - ${index}`
    const count = ids[result] || 0
    ids[result] = count + 1
    return `${result} - ${count}`
  }

  const result: ValueStack = {
    value: oldStack?.value || 0,
    stack: [],
  }

  let mods: ModifierResult[] = []
  if (Array.isArray(mod)) {
    mods = mod
  } else if (mod) {
    mods = [mod]
  } else {
    mods = []
  }
  for (let i = 0; i < mods.length; i++) {
    const mod = mods[i]
    for (const it of mod?.source || []) {
      const source = describeModifierSource(it.source)
      const id = getId(i, source.label, it.limit)
      result.stack.push({
        value: patchPrecision(it.value * it.scale),
        cap: it.limit ?? null,
        label: source.label,
        icon: source.icon,
        tag: id,
      })
    }
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
