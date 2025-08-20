import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, resource, signal } from '@angular/core'
import { getAbilityCategoryTag, getItemIconPath, NW_FALLBACK_ICON } from '@nw-data/common'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { Mannequin } from '~/nw/mannequin'
import { ModifierResult } from '~/nw/mannequin/modifier'
import { TooltipModule } from '~/ui/tooltip'
import { humanize } from '~/utils'
import { FlashDirective } from './ui/flash.directive'
import { ModifierTipComponent } from './ui/modifier-tip.component'

export interface CooldownRow {
  label: string
  icon?: string
  category?: string
  cooldown: number
  reductions: Array<{
    label: string
    value: number
    mod: ModifierResult
  }>
}

@Component({
  selector: 'nwb-gear-cell-mods-cooldown',
  templateUrl: './gear-cell-mods-cooldown.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ModifierTipComponent, TooltipModule, FlashDirective],
  host: {
    class: 'block',
    '[class.hidden]': '!rowCount()',
  },
})
export class GearCellModsCooldownComponent {
  private mannequin = inject(Mannequin)
  private db = injectNwData()

  private cooldowns = resource({
    loader: () => this.db.cooldownsByAbilityIdMap(),
    defaultValue: new Map(),
  }).value

  protected abilities = computed(() => {
    const cooldowns = this.cooldowns()
    const abilities = this.mannequin.activeWeaponAbilities()
    const stats = this.mannequin.modCooldownReduction()
    if (!cooldowns || !abilities || !stats) {
      return []
    }
    return abilities
      .map((ability) => {
        return {
          cooldown: cooldowns.get(ability.AbilityID)?.[0],
          ability: ability,
        }
      })
      .filter((it) => !!it.cooldown?.Time)
      .map((it): CooldownRow => {
        return {
          label: it.ability.DisplayName,
          icon: it.ability.Icon,
          category: getAbilityCategoryTag(it.ability),
          cooldown: it.cooldown.Time,
          reductions: Object.entries(stats.Weapon || {}).map(([label, stat]) => {
            return {
              label: humanize(label),
              value: it.cooldown.Time * stat.value,
              mod: stat,
            }
          }),
        }
      })
  })

  protected consumables = computed(() => {
    const consumables = this.mannequin.activeConsumables()
    const stats = this.mannequin.modCooldownReduction()
    if (!consumables) {
      return []
    }
    return consumables
      .filter((it) => it.item && it.consumable?.CooldownDuration && it.consumable.CooldownId)
      .map(({ item, consumable }): CooldownRow => {
        return {
          label: item.Name,
          icon: getItemIconPath(item) || NW_FALLBACK_ICON,
          category: item.ItemID,
          cooldown: consumable.CooldownDuration,
          reductions: [
            {
              label: 'Cooldown Reduction',
              value: stats.Consumable?.[consumable.ConsumableID]?.value * consumable.CooldownDuration,
              mod: stats.Consumable?.[consumable.ConsumableID],
            },
          ].filter((it) => !!it.mod),
        }
      })
  })

  protected rowCount = computed(() => this.rows().length)
  protected rows = computed(() => {
    const abilities = this.abilities() || []
    const consumables = this.consumables() || []
    return [...abilities, ...consumables]
  })

  protected modValue = signal({ group: '', value: 0 })
  protected setMod(group: string, value: number) {
    this.modValue.set({ group, value })
  }
}
