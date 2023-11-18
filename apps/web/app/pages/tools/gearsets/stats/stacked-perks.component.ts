import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Renderer2, computed, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { getItemGsBonus, getPerkMultiplier, isPerkGenerated } from '@nw-data/common'
import { Ability, Statuseffect } from '@nw-data/generated'
import { groupBy } from 'lodash'
import { combineLatest, map, tap } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { ActivePerk, Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'

@Component({
  standalone: true,
  selector: 'nwb-stacked-perks',
  templateUrl: './stacked-perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule],
  host: {
    class: 'block',
    '[class.hidden]': '!hasStacks()'
  },
})
export class StackedPerksComponent {
  private db = inject(NwDbService)
  private mannequin = inject(Mannequin)
  private data = toSignal(
    combineLatest({
      perks: this.mannequin.activePerks$,
      effects: this.db.statusEffectsMap,
      abilities: this.db.abilitiesMap,
    }),
  )
  protected stacks = computed(() => {
    const { perks, effects, abilities } = (this.data() || {})
    if (!perks || !effects || !abilities) {
      return null
    }
    const stackable = selectStackablePerks(perks, effects, abilities)
    const stacks = selectPerkStacks(stackable, abilities)
    return stacks
  })
  protected hasStacks = computed(() => this.stacks()?.length > 0)

}

function selectStackablePerks(
  perks: ActivePerk[],
  effects: Map<string, Statuseffect>,
  abilities: Map<string, Ability>,
) {
  return perks.filter(({ perk, affix }) => {
    if (!perk.ScalingPerGearScore) {
      return false
    }
    if (perk.EquipAbility?.some((it) => abilities.get(it)?.IsStackableAbility)) {
      return true
    }
    const effect = effects.get(affix?.StatusEffect)
    if (effect && effect.StackMax !== 1) {
      return true
    }
    if (isPerkGenerated(perk) && !perk.EquipAbility && !affix?.StatusEffect) {
      return true
    }
    return false
  })
}

function selectPerkStacks(perks: ActivePerk[], abilities: Map<string, Ability>) {
  return Array.from(Object.values(groupBy(perks, (it) => it.perk.PerkID)))
    .map((group) => {
      const { perk, gearScore, item } = group[0]
      const scale = getPerkMultiplier(perk, gearScore + getItemGsBonus(perk, item))
      const stackTotal = group.length
      let stackLimit: number = null
      perk.EquipAbility?.forEach((it) => {
        const stackMax = abilities.get(it)?.IsStackableMax
        if (stackMax) {
          if (stackLimit === null) {
            stackLimit = stackMax
          } else {
            stackLimit = Math.min(stackLimit, stackMax)
          }
        }
      })
      const stackCount = stackLimit ? Math.min(stackTotal, stackLimit) : stackTotal
      return {
        id: perk.PerkID,
        icon: perk.IconPath,
        total: group.length,
        stackTotal,
        stackLimit,
        stackCount,
        multiplier: stackCount * scale,
        description: perk.Description,
        name: perk.DisplayName,
      }
    })
    .filter((it) => it.stackLimit == null || it.stackLimit > 1)
    .filter((it) => it.stackTotal > 1)
}
