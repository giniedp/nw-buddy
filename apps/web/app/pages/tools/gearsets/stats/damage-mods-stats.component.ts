import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed } from '@angular/core'
import { map } from 'rxjs'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult } from '~/nw/mannequin/modifier'
import { damageTypeIcon } from '~/nw/weapon-types'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'
import { ModifierTipComponent } from './modifier-tip.component'
import { FlashDirective } from './utils/flash.directive'

@Component({
  standalone: true,
  selector: 'nwb-damage-mods-stats',
  templateUrl: './damage-mods-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule, ModifierTipComponent, FlashDirective],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class DamageModsStatsComponent {
  protected trackBy = (i: number) => i

  protected rowCount = computed(() => this.rows().length)
  protected rows = selectSignal(
    {
      base: this.mannequin.statDamageBase$,
      mods: this.mannequin.statDamageMods$,
      attack: this.mannequin.activeDamageTableRow$,
    },
    (({ base, mods, attack }) => {
      if (!base || !mods) {
        return []
      }

      const result: Array<ModifierResult & { label: string; icon?: string; prefix?: string }> = []

      result.push({ prefix: '+', label: `Damage Coefficient`, ...base.DamageCoef })

      if (base.ModPvp) {
        result.push({
          prefix: base.ModPvp.value < 0 ? '-' : '+',
          label: `Damage PvP Balance`,
          ...base.ModPvp,
        })
      }

      if (base.ModAmmo) {
        result.push({ prefix: '+', label: `Ammo Coefficient`, ...base.ModAmmo })
      }

      if (base.ModBase?.value) {
        result.push({
          prefix: '+',
          label: `Damage Bonus`,
          icon: damageTypeIcon(base.DamageType),
          ...base.ModBase,
        })
      }
      if (base.ModBaseConvert?.value && base.ConvertType) {
        result.push({
          prefix: '+',
          label: `Damage Bonus`,
          icon: damageTypeIcon(base.ConvertType),
          ...base.ModBaseConvert,
        })
      }

      result.push({ prefix: '+', label: 'Crit Bonus', ...mods.Crit })
      result.push({ prefix: '+', label: 'Backstab Bonus', ...mods.Backstab })
      if (attack?.IsRanged) {
        result.push({ prefix: '+', label: 'Headshot Bonus', ...mods.Headshot })
      }
      // result.push({ prefix: '+', label: 'Stagger Damage', ...mods.StaggerDamage })
      result.push({ prefix: '+', label: 'Threat', ...mods.Threat })

      // if (base.HealMod) {
      //   result.push({ prefix: '+', label: 'Heal Bonus', ...base.HealMod })
      // }

      // result.push({ prefix: '+', label: 'Armor Penetration', ...mods.ArmorPenetration })
      // result.push({ prefix: '+', label: 'Armor Penetration Backstab', ...mods.ArmorPenetrationBack })
      // if (attack?.IsRanged) {
      //   result.push({ prefix: '+', label: 'Armor Penetration Headshot', ...mods.ArmorPenetrationHead })
      // }

      if (mods.CritChance.value) {
        result.push({ prefix: '', label: 'Crit Chance', ...mods.CritChance })
        //result.push({ prefix: '', label: 'Effective crit', source: [], value: avgCritrate(0, mods.CritChance.value)})
      }

      // result.push({ prefix: '+', label: `Base Damage Reduction`, ...mods.BaseReduction })
      // result.push({ prefix: '+', label: 'Crit Damage Reduction', ...mods.CritReduction })
      //result.push({ prefix: '+', label: 'Stagger Damage Reduction', ...mods.StaggerDamageReduction })

      return result.filter((it) => !!it.value)
    }),
  )

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
