import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed } from '@angular/core'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult } from '~/nw/mannequin/modifier'
import { damageTypeIcon } from '~/nw/weapon-types'
import { TooltipModule } from '~/ui/tooltip'
import { FlashDirective } from './ui/flash.directive'
import { ModifierTipComponent } from './ui/modifier-tip.component'

@Component({
  selector: 'nwb-gear-cell-mods-misc',
  templateUrl: './gear-cell-mods-misc.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class GearCellModsMiscComponent {
  protected rowCount = computed(() => this.rows().length)
  protected rows = computed(() => {
    const crit = this.mannequin.modCrit()
    const attack = this.mannequin.activeDamageTableRow()
    const modCoef = this.mannequin.modDmgCoef()
    const modThreat = this.mannequin.modThreat()
    const modAmmo = this.mannequin.modAmmo()
    const modPvP = this.mannequin.modPvP()

    const modBase = this.mannequin.modBaseDamage()

    const result: Array<ModifierResult & { label: string; icon?: string; prefix?: string }> = []

    result.push({ prefix: '+', label: `Damage Coefficient`, ...modCoef })

    if (modPvP?.source.length) {
      result.push({
        prefix: modPvP.value < 0 ? '-' : '+',
        label: `Damage PvP Balance`,
        ...modPvP,
      })
    }

    if (modAmmo?.source.length) {
      result.push({ prefix: '+', label: `Ammo Coefficient`, ...modAmmo })
    }

    if (modBase?.Weapon?.Damage.source.length) {
      result.push({
        prefix: '+',
        label: `Damage Bonus`,
        icon: damageTypeIcon(modBase.Weapon?.Type),
        ...modBase.Weapon?.Damage,
      })
    }
    if (modBase?.Affix?.Damage?.source?.length && modBase?.Affix?.Percent) {
      result.push({
        prefix: '+',
        label: `Damage Bonus`,
        icon: damageTypeIcon(modBase.Affix.Type),
        ...modBase.Affix.Damage,
      })
    }

    if (crit?.Damage) {
      result.push({ prefix: '+', label: 'Crit Bonus', ...crit.Damage })
    }
    if (modThreat?.source.length) {
      result.push({ prefix: '+', label: 'Threat', ...modThreat })
    }

    // if (base.HealMod) {
    //   result.push({ prefix: '+', label: 'Heal Bonus', ...base.HealMod })
    // }

    // result.push({ prefix: '+', label: 'Armor Penetration', ...mods.ArmorPenetration })
    // result.push({ prefix: '+', label: 'Armor Penetration Backstab', ...mods.ArmorPenetrationBack })
    // if (attack?.IsRanged) {
    //   result.push({ prefix: '+', label: 'Armor Penetration Headshot', ...mods.ArmorPenetrationHead })
    // }

    if (crit.Chance?.value) {
      result.push({ prefix: '', label: 'Crit Chance', ...crit.Chance })
      //result.push({ prefix: '', label: 'Effective crit', source: [], value: avgCritrate(0, mods.CritChance.value)})
    }

    // result.push({ prefix: '+', label: `Base Damage Reduction`, ...mods.BaseReduction })
    // result.push({ prefix: '+', label: 'Crit Damage Reduction', ...mods.CritReduction })
    //result.push({ prefix: '+', label: 'Stagger Damage Reduction', ...mods.StaggerDamageReduction })

    return result.filter((it) => !!it.value)
  })
  // selectSignal(
  //   {
  //     base: this.mannequin.statDamageBase,
  //     mods: this.mannequin.statDamageMods,
  //     attack: this.mannequin.activeDamageTableRow,
  //   },
  //   (({ base, mods, attack }) => {

  //   }),
  // )

  public constructor(private mannequin: Mannequin) {
    //
  }
}
function avgCritrate(p: number, p_0: number) {
  // computes average crit rate with bad luck protection
  // assuming a total crit of p and a base crit of p0
  let sum: number = 0
  let maxHits: number = 0
  if (!p_0) {
    return p
  }
  maxHits = Math.ceil((1 - p + p_0) / p_0)
  for (let hit = 0; hit < maxHits; hit++) {
    sum += (hit + 1) * prod(0, hit, p, p_0) * Math.min(p + hit * p_0, 1) // changed (hits * p) to min(hits * p, 1)
  }
  return 1 / sum
}
function prod(start: number, end: number, p: number, p_0: number) {
  let result = 1
  for (let m = start; m < end; m++) {
    result = result * Math.max(1 - (p + m * p_0), 0)
  }
  return result
}
