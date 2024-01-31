import { CommonModule } from '@angular/common'
import { Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ComponentStore } from '@ngrx/component-store'
import {
  AttributeRef,
  NW_MAX_CHARACTER_LEVEL,
  NW_MAX_GEAR_SCORE,
  damageFactorForAttrs,
  damageFactorForGS,
  damageFactorForLevel,
  damageForWeapon,
  damageMitigationPercent,
  damageScaleAttrs,
  patchPrecision,
  pvpGearScore,
} from '@nw-data/common'
import { takeUntil } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { InputSliderComponent } from '~/ui/input-slider'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { humanize, selectStream } from '~/utils'
import { AttributesEditorModule } from '~/widgets/attributes-editor'

export interface DmgSandboxState {
  playerLevel: number
  weapon: string
  attack: string
  baseDamage: number
  critDamage: number
  weaponGearScore: number
  damageCoefficient: number
  ammoModifier: number
  attackOptions: Array<{ label: string; value: string }>
  baseDamageMods: number
  critMods: number
  empowerMods: number
  weaponScale: Record<AttributeRef, number>
  attrStats: Record<AttributeRef, number>
  attrTable: Array<{ level: number, scaling: number }>
  armorPenetration: number
  attackerAvgGs: number
  defenderAvgGs: number
  defenderArmorRating: number
}
@Component({
  standalone: true,
  templateUrl: './dmg-sandbox-page.component.html',
  imports: [
    CommonModule,
    FormsModule,
    NwModule,
    AttributesEditorModule,
    TooltipModule,
    InputSliderComponent,
    LayoutModule,
  ],
  host: {
    class: 'flex flex-col flex-1 overflow-hidden',
  },
})
export class DmgSandboxPageComponent extends ComponentStore<DmgSandboxState> {
  private db = inject(NwDbService)

  public playerLevel = this.selectSignal(({ playerLevel }) => playerLevel)
  public playerLevelFactor = computed(() => damageFactorForLevel(this.playerLevel()))

  public weapon = this.selectSignal(({ weapon }) => weapon)
  public attack = this.selectSignal(({ attack }) => attack)
  public baseDamage = this.selectSignal(({ baseDamage }) => baseDamage)
  public critDamage = this.selectSignal(({ critDamage }) => critDamage)

  public weaponGearScore = this.selectSignal(({ weaponGearScore }) => weaponGearScore)
  public weaponGearScoreFactor = computed(() => damageFactorForGS(this.weaponGearScore()))

  public damageCoefficient = this.selectSignal(({ damageCoefficient }) => damageCoefficient)
  public ammoModifier = this.selectSignal(({ ammoModifier }) => ammoModifier)
  public baseDamageMods = this.selectSignal(({ baseDamageMods }) => baseDamageMods)
  public critMods = this.selectSignal(({ critMods }) => critMods)
  public critModsSum = computed(() => Math.max(0, this.critDamage() - 1 + this.critMods()))
  public empowerMods = this.selectSignal(({ empowerMods }) => empowerMods)

  public armorPenetration = this.selectSignal(({ armorPenetration }) => armorPenetration)
  public attackerAvgGs = this.selectSignal(({ attackerAvgGs }) => attackerAvgGs)
  public defenderAvgGs = this.selectSignal(({ defenderAvgGs }) => defenderAvgGs)
  public defenderArmorRating = this.selectSignal(({ defenderArmorRating }) => defenderArmorRating)

  protected weaponScale = this.selectSignal(({ weaponScale }) => weaponScale)
  protected attrStats = this.selectSignal(({ attrStats }) => attrStats)
  protected attrSums = this.selectSignal(({ attrTable, attrStats }) => {
    return {
      dex: attrTable[Math.min(attrStats.dex, attrTable.length-1)]?.scaling,
      str: attrTable[Math.min(attrStats.str, attrTable.length-1)]?.scaling,
      int: attrTable[Math.min(attrStats.int, attrTable.length-1)]?.scaling,
      foc: attrTable[Math.min(attrStats.foc, attrTable.length-1)]?.scaling,
      con: attrTable[Math.min(attrStats.con, attrTable.length-1)]?.scaling,
    }
  })
  protected attrScale = computed(() => {
    return damageFactorForAttrs({
      weapon: this.weaponScale(),
      attributes: this.attrSums(),
    })
  })

  public dmgTooltip = computed(() => {
    return damageForWeapon({
      playerLevel: this.playerLevel(),
      baseDamage: this.baseDamage(),
      weaponGearScore: this.weaponGearScore(),
      weaponScale: this.weaponScale(),
      attributes: this.attrSums(),
      damageCoef: this.damageCoefficient(),
    })
  })

  public dmgStandard = computed(() => {
    return damageForWeapon({
      playerLevel: this.playerLevel(),
      baseDamage: this.baseDamage(),
      weaponGearScore: this.weaponGearScore(),
      weaponScale: this.weaponScale(),
      attributes: this.attrSums(),
      damageCoef: this.damageCoefficient(),
      ammoMod: this.ammoModifier(),
      baseMod: this.baseDamageMods(),
      critMod: 0,
      empowerMod: this.empowerMods(),
    })
  })

  public dmgStandardMitigation = computed(() => {
    return this.dmgStandard() * this.damageMitigationFactor()
  })

  public damageMitigationFactor = computed(() => {
    return damageMitigationPercent({
      gearScore: pvpGearScore({
        attackerAvgGearScore: this.attackerAvgGs(),
        defenderAvgGearScore: this.defenderAvgGs(),
        weaponGearScore: this.weaponGearScore(),
      }),
      armorPenetration: this.armorPenetration(),
      armorRating: this.defenderArmorRating(),
    })
  })

  public dmgCrit = computed(() => {
    return damageForWeapon({
      playerLevel: this.playerLevel(),
      baseDamage: this.baseDamage(),
      weaponGearScore: this.weaponGearScore(),
      weaponScale: this.weaponScale(),
      attributes: this.attrSums(),
      damageCoef: this.damageCoefficient(),
      ammoMod: this.ammoModifier(),
      baseMod: this.baseDamageMods(),
      critMod: this.critModsSum(),
      empowerMod: this.empowerMods(),
    })
  })

  public dmgCritMitigation = computed(() => {
    return this.dmgCrit() * this.damageMitigationFactor()
  })

  protected weaponTypes = NW_WEAPON_TYPES.map((it) => {
    return {
      label: it.UIName,
      value: it.WeaponTag,
    }
  })
  protected attackTypes = this.selectSignal(({ attackOptions }) => attackOptions)

  public constructor() {
    super({
      playerLevel: NW_MAX_CHARACTER_LEVEL,
      weapon: NW_WEAPON_TYPES[0].WeaponTag,
      attack: '',
      baseDamage: 0,
      critDamage: 0,
      weaponGearScore: NW_MAX_GEAR_SCORE,
      damageCoefficient: 0,
      ammoModifier: 0,
      baseDamageMods: 0,
      critMods: 0,
      empowerMods: 0,
      attackOptions: [],
      weaponScale: {
        dex: 0,
        str: 0,
        int: 0,
        foc: 0,
        con: 0,
      },
      attrStats: {
        dex: 5,
        str: 5,
        int: 5,
        foc: 5,
        con: 5,
      },
      attrTable: [],
      attackerAvgGs: 0,
      defenderAvgGs: 0,
      armorPenetration: 0,
      defenderArmorRating: 0,
    })

    selectStream(
      {
        weaponTag: this.select(({ weapon }) => weapon),
        weaponMap: this.db.weaponsMap,
        damageRows: this.db.damageTable0,
        attrs: this.db.attrStr,
      },
      ({ weaponTag, weaponMap, damageRows, attrs }) => {


        const weaponType = NW_WEAPON_TYPES.find((it) => it.WeaponTag === weaponTag)
        const weapon = weaponMap?.get(weaponType?.StatsRef)
        const rows = damageRows?.filter((it) => !!weaponType && it.DamageID.toLowerCase().startsWith(weaponType.DamageTablePrefix.toLowerCase()))
        this.patchState({
          baseDamage: weapon?.BaseDamage || 0,
          critDamage: patchPrecision(weapon?.CritDamageMultiplier || 0),
          weaponScale: damageScaleAttrs(weapon),
          attack: rows[0]?.DamageID,
          attrTable: attrs.map((it) => {
            return {
              level: it.Level,
              scaling: it.ModifierValueSum
            }
          }),
          attackOptions: rows.map(({ DamageID, AttackType, DmgCoef }) => {
            return {
              label: [
                humanize(DamageID.replace(weaponType?.DamageTablePrefix ?? '', '')),
                `| ${AttackType}`,
                `| ${patchPrecision(DmgCoef)}`,
              ].join(' '),
              value: DamageID,
            }
          }),
        })
      },
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe()

    selectStream(
      {
        attack: this.select(({ attack }) => attack),
        damageRows: this.db.damageTable0,
      },
      ({ attack, damageRows }) => {
        this.patchState({
          damageCoefficient: patchPrecision(damageRows?.find((it) => it.DamageID === attack)?.DmgCoef ?? 1),
        })
      },
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe()
  }
}
