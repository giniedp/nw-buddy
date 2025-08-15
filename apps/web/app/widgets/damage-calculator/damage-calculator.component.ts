import { CommonModule } from '@angular/common'
import {
  Attribute,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  Input,
  OnInit,
  TemplateRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { getState, patchState } from '@ngrx/signals'
import { getDamageScalingForWeapon, patchPrecision } from '@nw-data/common'
import { EMPTY, combineLatest, map, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { Mannequin } from '~/nw/mannequin'
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
import { DamageCalculatorState, DamageCalculatorStore, updateDefender, updateOffender } from './damage-calculator.store'
import { mergeDamageStacks } from './damage-mod-stack'
import { DamageOutputComponent } from './damage-output.component'
import { DamageResultsComponent } from './damage-results.component'
import { DamageIndicatorService } from './damage-indicator.service'

@Component({
  selector: 'nwb-damage-calculator',
  templateUrl: './damage-calculator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    OffenderConversionControlComponent,
    DamageOutputComponent,
    DamageResultsComponent,
    DefenderElementalArmorControlComponent,
    DefenderModsControlComponent,
    DefenderPhysicalArmorControlComponent,
    DefenderStatsControlComponent,
    OffenderAttackControlComponent,
    OffenderModsControlComponent,
    OffenderStatsControlComponent,
    OffenderWeaponControlComponent,
    OffenderDotControlComponent,
    LayoutModule,
    IconsModule,
    TooltipModule,
  ],
  host: {
    class: 'flex flex-col',
  },
  providers: [DamageCalculatorStore, DamageIndicatorService],
})
export class DamageCalculatorComponent implements OnInit {
  private db = injectNwData()
  private injector = inject(Injector)
  private destroyRef = inject(DestroyRef)
  protected store = inject(DamageCalculatorStore)

  public readonly tplFormula = viewChild<TemplateRef<any>>('tplFormula')

  protected isOffenderBound = computed(() => this.store.offender.isBound())
  protected isDefenderBound = computed(() => this.store.defender.isBound())

  @Input()
  public set state(value: DamageCalculatorState) {
    if (!value) {
      return
    }
    this.store.setState(value)
  }

  public stateChange = output<DamageCalculatorState>()

  public player = input<Mannequin>(null)
  private player$ = toObservable(this.player)

  public opponent = input<Mannequin>(null)
  private opponent$ = toObservable(this.opponent)

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
          const vitalCategories$ = toObservable(this.store.defenderVitalId, { injector: this.injector })
            .pipe(switchMap((id) => this.db.vitalsById(id)))
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

              armorPenetration: mergeDamageStacks(modArmorPenetration.Base, this.store.offender.armorPenetration()),
              modAmmo: mergeDamageStacks(modAmmo, this.store.offender.modAmmo()),
              modPvP: mergeDamageStacks(modPvP, this.store.offender.modPvP()),
              modCrit: mergeDamageStacks(modCrit.Damage, this.store.offender.modCrit()),
              modBase: mergeDamageStacks(modBase.Weapon?.Damage, this.store.offender.modBase()),
              modBaseAffix: mergeDamageStacks(modBase?.Affix?.Damage, this.store.offender.modBaseAffix()),
              modBaseDot: mergeDamageStacks(modBase?.Base?.[dotType], this.store.offender.modBaseDot()),
              modDMG: mergeDamageStacks(
                [
                  modDMG.byDamageType[modBase.Weapon?.Type],
                  ...vitalCategories.map((category) => modDMG.byVitalsType[category] || []),
                ],
                this.store.offender.modDMG(),
              ),
              modDMGAffix: mergeDamageStacks(
                [
                  modDMG.byDamageType[modBase?.Affix?.Type],
                  ...vitalCategories.map((category) => modDMG.byVitalsType[category] || []),
                ],
                this.store.offender.modDMGAffix(),
              ),
              modDMGDot: mergeDamageStacks(modDMG.byDamageType[dotType], this.store.offender.modDMGDot()),
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
              modABS: mergeDamageStacks(modAbs?.DamageCategories[dmgTypeWeapon], this.store.defender.modABS()),
              modABSAffix: mergeDamageStacks(modAbs?.DamageCategories[dmgTypeAffix], this.store.defender.modABSAffix()),
              modABSDot: mergeDamageStacks(modAbs?.DamageCategories[dmgTypeDot], this.store.defender.modABSDot()),
              modWKN: mergeDamageStacks(modWKN?.[dmgTypeWeapon], this.store.defender.modWKN()),
              modWKNAffix: mergeDamageStacks(modWKN?.[dmgTypeAffix], this.store.defender.modWKNAffix()),
              modWKNDot: mergeDamageStacks(modWKN?.[dmgTypeDot], this.store.defender.modWKNDot()),
              modBaseReduction: mergeDamageStacks(
                modBase?.Reduction?.[dmgTypeWeapon],
                this.store.defender.modBaseReduction(),
              ),
              modBaseReductionAffix: mergeDamageStacks(
                modBase?.Reduction?.[dmgTypeAffix],
                this.store.defender.modBaseReduction(),
              ),
              modBaseReductionDot: mergeDamageStacks(
                modBase?.Reduction?.[dmgTypeDot],
                this.store.defender.modBaseReduction(),
              ),
              modCritReduction: mergeDamageStacks(modCrit?.DamageReduction, this.store.defender.modCritReduction()),
              elementalArmor: {
                value: patchPrecision(modArmor?.ElementalBase?.armorRating ?? 0, 1),
                stack: this.store.defender.elementalArmor().stack,
              },
              elementalArmorAdd: {
                value: patchPrecision(modArmor?.ElementalBase?.weaponRating ?? 0, 1),
                stack: this.store.defender.elementalArmorAdd().stack,
              },
              elementalArmorFortify: mergeDamageStacks(
                modArmor?.Elemental,
                this.store.defender.elementalArmorFortify(),
              ),
              physicalArmor: {
                value: patchPrecision(modArmor?.PhysicalBase?.armorRating ?? 0, 1),
                stack: this.store.defender.physicalArmor().stack,
              },
              physicalArmorAdd: {
                value: patchPrecision(modArmor?.PhysicalBase?.weaponRating ?? 0, 1),
                stack: this.store.defender.physicalArmorAdd().stack,
              },
              physicalArmorFortify: mergeDamageStacks(modArmor?.Physical, this.store.defender.physicalArmorFortify()),
            }),
          )
        },
      )
  }
}
