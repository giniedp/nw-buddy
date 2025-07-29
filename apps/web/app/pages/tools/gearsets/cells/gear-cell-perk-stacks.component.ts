import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import {
  getItemGsBonus,
  getPerkOnlyMultiplier,
  hasPerkScalingPerGearScore,
  isPerkGenerated,
  walkNwExpression,
} from '@nw-data/common'
import { AbilityData, StatusEffectData } from '@nw-data/generated'
import { groupBy, sortBy, sumBy } from 'lodash'
import { injectNwData } from '~/data'
import { LocaleService, TranslateService } from '~/i18n'
import { NwModule } from '~/nw'
import { ActivePerk, Mannequin } from '~/nw/mannequin'
import { TooltipModule } from '~/ui/tooltip'
import { selectSignal } from '~/utils'

@Component({
  selector: 'nwb-gear-cell-perk-stacks',
  templateUrl: './gear-cell-perk-stacks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, TooltipModule],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class GearCellPerkStacksComponent {
  private db = injectNwData()
  private mannequin = inject(Mannequin)
  private i18n = inject(LocaleService)
  private tl8 = inject(TranslateService)
  protected rowCount = computed(() => this.rows()?.length)
  protected rows = selectSignal(
    {
      perks: this.mannequin.activePerks,
      effects: this.db.statusEffectsByIdMap(),
      abilities: this.db.abilitiesByIdMap(),
      locale: this.i18n.value$,
    },
    ({ perks, effects, abilities }) => selectRows({ perks, effects, abilities, tl8: this.tl8 }),
  )
}

function selectRows({
  perks,
  effects,
  abilities,
  tl8,
}: {
  perks: ActivePerk[]
  effects: Map<string, StatusEffectData>
  abilities: Map<string, AbilityData>
  tl8: TranslateService
}) {
  if (!perks || !effects || !abilities) {
    return []
  }
  const stackable = selectStackablePerks({ perks, effects, abilities })
  const stacks = selectPerkStacks(stackable, abilities, tl8)
  // HINT: sort by length of description helps to reduce gaps in layout
  return sortBy(stacks, (it) => it.description.length)
}

function selectStackablePerks({
  perks,
  effects,
  abilities,
}: {
  perks: ActivePerk[]
  effects: Map<string, StatusEffectData>
  abilities: Map<string, AbilityData>
}) {
  return perks.filter(({ perk, affix }) => {
    // if (!perk.ScalingPerGearScore) {
    //   // HINT: in order to show correct number on tooltip, we need ScalingPerGearScore to be present
    //   return false
    // }
    if (perk.EquipAbility?.some((it) => abilities.get(it)?.IsStackableAbility)) {
      return true
    }
    const effect = effects.get(affix?.StatusEffect)
    if (effect && effect.StackMax !== 1) {
      // HINT: StackMax may be set or not. Reject only if it is explicitly set to 1
      return true
    }
    if (isPerkGenerated(perk) && !perk.EquipAbility && !affix?.StatusEffect) {
      return true
    }
    return false
  })
}

function selectPerkStacks(perks: ActivePerk[], abilities: Map<string, AbilityData>, tl8: TranslateService) {
  return Array.from(Object.values(groupBy(perks, (it) => it.perk.PerkID)))
    .map((group) => {
      const { perk, gearScore, item } = group[0]

      let description = tl8.get(perk.Description)
      let scaleInjected = true
      if (!hasPerkScalingPerGearScore(perk)) {
        const withInjection = injectMultiplierIntoDescription(description)
        if (withInjection) {
          description = withInjection
        } else {
          scaleInjected = false
        }
      }
      description = injectFontColor(description)

      const scale = getPerkOnlyMultiplier(perk, gearScore + getItemGsBonus(perk, item))
      const stackTotal = group.length
      let stackLimit: number = null
      for (const abilityId of perk.EquipAbility || []) {
        const stackMax = abilities.get(abilityId)?.IsStackableMax
        if (stackMax) {
          stackLimit = Math.min(stackLimit ?? stackMax, stackMax)
        }
      }
      const stackCount = stackLimit ? Math.min(stackTotal, stackLimit) : stackTotal
      return {
        id: perk.PerkID,
        icon: perk.IconPath,
        total: group.length,
        stackTotal,
        stackLimit,
        stackCount,
        multiplier: stackCount * scale,
        description: description,
        scaleInjected,
        name: perk.DisplayName,
      }
    })
    .filter((it) => it.stackLimit == null || it.stackLimit > 1)
    .filter((it) => it.stackTotal > 1)
}

function injectMultiplierIntoDescription(description: string): string | null {
  if (description.includes('perkMultiplier')) {
    return description
  }
  const parts: Array<{ lParen?: string; text: string; rParen?: string }> = []
  walkNwExpression(description, {
    onText: (text) => parts.push({ text }),
    onExpression: (lParen, text, rParen) => {
      parts.push({ lParen, text, rParen })
    },
  })

  const forceInjection = sumBy(parts, (it) => (it.lParen ? 1 : 0)) === 1
  let isInjected = false
  const result = parts.map(({ lParen, text, rParen }) => {
    if (!lParen) {
      return text
    }
    if (forceInjection || text.includes('*')) {
      isInjected = true
      text = '{perkMultiplier} * ' + text
    }
    return [lParen, text, rParen].join('')
  })
  if (isInjected) {
    return result.join('')
  }
  return null
}

function injectFontColor(description: string) {
  const result: string[] = []
  walkNwExpression(description, {
    onText: (text) => result.push(text),
    onExpression: (lParen, text, rParen) => {
      text = [lParen, text, rParen].join('')
      if (text.includes('{perkMultiplier}')) {
        text = `<span class="text-primary font-bold">${text}</span>`
      }
      result.push(text)
    },
  })
  return result.join('')
}
