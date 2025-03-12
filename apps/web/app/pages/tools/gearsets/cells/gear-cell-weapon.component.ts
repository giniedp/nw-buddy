import { CdkMenuModule } from '@angular/cdk/menu'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { calculateDamage, getDamageScalingForWeapon, getDamageTypes } from '@nw-data/common'
import { DamageData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { CombatMode, Mannequin } from '~/nw/mannequin'
import { NW_WEAPON_TYPES, damageTypeIcon } from '~/nw/weapon-types'
import { IconsModule } from '~/ui/icons'
import { svgBurst, svgPeopleGroup } from '~/ui/icons/svg'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  selector: 'nwb-gear-cell-weapon',
  templateUrl: './gear-cell-weapon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, CdkMenuModule, FormsModule, IconsModule, TooltipModule],
  host: {
    class: 'layout-content',
  },
})
export class GearCellWeaponComponent {
  private mannequin = inject(Mannequin)
  protected combatModeOptions: Array<{ label: string; value: CombatMode }> = [
    {
      label: 'PvE',
      value: 'pve',
    },
    {
      label: 'PvP Arena',
      value: 'pvpArena',
    },
    {
      label: 'PvP Openworld',
      value: 'pvpOpenworld',
    },
    {
      label: 'PvP War',
      value: 'pvpWar',
    },
    {
      label: 'PvP Outpostrush',
      value: 'pvpOutpostrush',
    },
  ]

  protected weapon = this.mannequin.activeWeapon
  protected weaponTag = computed(() => this.weapon()?.weaponTag)
  protected weaponUnsheathed = computed(() => this.weapon()?.unsheathed)
  protected selectedAttack = this.mannequin.activeDamageTableRow
  protected attackOptions = this.mannequin.activeWeaponAttacks
  protected critType = this.mannequin.critType

  protected numAroundMe = this.mannequin.numAroundMe
  protected numHits = this.mannequin.numHits

  protected isSplit = computed(() => {
    const it = this.mannequin.modBaseDamage()
    return !!it.Affix?.Percent
  })

  protected iconGroup = svgPeopleGroup
  protected iconBurst = svgBurst

  protected totalStdDamage = computed(() => {
    return this.damage().total.stdFinal
  })
  protected totalCritDamage = computed(() => {
    return this.damage().total.critFinal
  })

  protected weaponStdDamage = computed(() => {
    return {
      icon: damageTypeIcon(this.mannequin.modBaseDamage().Weapon.Type),
      value: this.damage().weapon.stdFinal,
    }
  })
  protected weaponCritDamage = computed(() => {
    return {
      icon: damageTypeIcon(this.mannequin.modBaseDamage().Weapon.Type),
      value: this.damage().weapon.critFinal,
    }
  })

  protected affixStdDamage = computed(() => {
    if (!this.isSplit()) {
      return null
    }
    return {
      icon: damageTypeIcon(this.mannequin.modBaseDamage().Affix.Type),
      value: this.damage().affix.stdFinal,
    }
  })
  protected affixCritDamage = computed(() => {
    if (!this.isSplit()) {
      return null
    }
    return {
      icon: damageTypeIcon(this.mannequin.modBaseDamage().Affix.Type),
      value: this.damage().affix.critFinal,
    }
  })

  protected damage = computed(() => {
    const attr = this.mannequin.activeAttributes()
    const modBase = this.mannequin.modBaseDamage()
    const weapon = this.mannequin.activeWeapon()
    const attack = this.mannequin.activeDamageTableRow()
    const affix = modBase.Affix

    return calculateDamage({
      attacker: {
        isPlayer: true,
        level: this.mannequin.level(),
        gearScore: this.mannequin.gearScore(),
        attributeModSums: {
          con: attr.con?.scale || 0,
          dex: attr.dex?.scale || 0,
          str: attr.str?.scale || 0,
          int: attr.int?.scale || 0,
          foc: attr.foc?.scale || 0,
        },

        dotCoef: 0,
        dotRate: 0,
        dotDuration: 0,
        dotPotency: 0,

        preferHigherScaling: true,
        affixPercent: affix?.Percent,
        affixScaling: getDamageScalingForWeapon(affix?.Affix),

        weaponScaling: getDamageScalingForWeapon(weapon?.weapon),
        weaponGearScore: weapon?.gearScore,
        weaponDamage: weapon?.weapon?.BaseDamage,
        damageCoef: attack?.DmgCoef,
        damageAdd: attack?.AddDmg,
        armorPenetration: 0,

        modPvp: 0,
        modAmmo: 0,
        modCrit: this.mannequin.modCrit()?.Damage?.value,
        modBase: modBase?.Weapon?.Damage?.value,
        modBaseAffix: modBase?.Affix?.Damage?.value,
        modBaseDot: 0,
        modDMG: this.mannequin.modDMG()?.byDamageType?.[modBase?.Weapon?.Type]?.value,
        modDMGAffix: this.mannequin.modDMG()?.byDamageType?.[modBase?.Affix?.Type]?.value,
        modDMGDot: 0,
      },
      defender: {
        isPlayer: false,
        level: 0,
        gearScore: 0,
        armorRating: 0,
        armorRatingAffix: 0,
        armorRatingDot: 0,
        reductionBase: 0,
        reductionBaseAffix: 0,
        reductionBaseDot: 0,
        reductionCrit: 0,
        modABS: 0,
        modABSAffix: 0,
        modABSDot: 0,
        modWKN: 0,
        modWKNAffix: 0,
        modWKNDot: 0,
      },
    })
  })
  protected async toggleWeapon() {
    const state = this.mannequin.state()
    patchState(this.mannequin.state, {
      weaponActive: state.weaponActive === 'secondary' ? 'primary' : 'secondary',
    })
  }

  protected async toggleSheathed() {
    const state = this.mannequin.state()
    patchState(this.mannequin.state, {
      weaponUnsheathed: !state.weaponUnsheathed,
    })
  }

  protected async commitAttack(row: DamageData) {
    patchState(this.mannequin.state, {
      selectedAttack: row?.DamageID,
    })
  }

  protected async commitNumAroundMe(value: number) {
    patchState(this.mannequin.state, {
      numAroundMe: value,
    })
  }

  protected async commitNumHits(value: number) {
    patchState(this.mannequin.state, {
      numHits: value,
    })
  }

  protected async commitCombatMode(value: CombatMode) {
    patchState(this.mannequin.state, {
      combatMode: value,
    })
  }

  protected labelForAttack(attack: DamageData, weaponTag: string) {
    const prefix = NW_WEAPON_TYPES.find((it) => it.WeaponTag === weaponTag)?.DamageTablePrefix
    return attack.DamageID.replace(prefix || '', '')
  }

  protected damageIcon(type: string) {
    return damageTypeIcon(type)
  }

  protected toggleCritType() {
    const type = this.critType()
    if (type === 'crit') {
      patchState(this.mannequin.state, {
        critType: 'backstab',
      })
    } else if (type === 'backstab') {
      patchState(this.mannequin.state, {
        critType: 'headshot',
      })
    } else {
      patchState(this.mannequin.state, {
        critType: 'crit',
      })
    }
  }
}
