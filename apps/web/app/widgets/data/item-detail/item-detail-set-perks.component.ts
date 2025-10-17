import { Component, computed, inject, input } from '@angular/core'
import { explainPerk, getItemGsBonus, isPerkApplicableToItem } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { PerkData } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { apiResource } from '~/utils'
import { ItemDetailStore } from './item-detail.store'
import { PerkSlotExplained } from './selectors'

@Component({
  selector: 'nwb-item-detail-set-perks',
  templateUrl: './item-detail-set-perks.component.html',
  imports: [NwModule, ItemFrameModule, IconsModule, TooltipModule],
  host: {
    class: 'flex flex-col gap-1',
    'animate.enter': 'fade-grow-y-in',
    'animate.leave': 'fade-grow-y-out',
    '[class.hidden]': 'isHidden()',
  },
})
export class ItemDetailSetPerksComponent {
  protected db = injectNwData()
  protected store = inject(ItemDetailStore)
  protected isHidden = computed(() => !this.rows()?.length)
  protected name = computed(() => this.store.equipmentSet()?.DisplayName)
  public count = input<number>(0)
  public disableTitle = input(false)
  public disableLink = input(false)

  protected isActive = computed(() => {
    if (!this.count()) {
    }
  })
  private resource = apiResource({
    request: () => this.store.equipmentSet(),
    loader: async ({ request }) => {
      return Promise.all(
        (request?.Perks || []).map(async (slot) => {
          const perk = await this.db.perksById(slot.PerkID)
          return {
            perkId: slot.PerkID,
            perk,
            threshold: slot.PerkThreshold,
            abilities: await fetchAbilities(this.db, perk),
            affixes: await fetchAffixes(this.db, perk),
          }
        }),
      )
    },
  })

  protected max = computed(() => {
    let max = 0
    for (const perk of this.store.equipmentSet()?.Perks || []) {
      max = Math.max(max, perk.PerkThreshold)
    }
    return max
  })

  protected rows = computed(() => {
    const item = this.store.item()
    const itemGS = this.store.itemGS()
    const slots = this.resource.value() || []
    const result = slots.map(
      ({ perkId, perk, abilities, affixes, threshold }): PerkSlotExplained & { threshold: number } => {
        return {
          key: null,
          perkId: perkId,
          perk: perk,
          threshold,
          violatesExclusivity: false,
          violatesItemClass: !!perk && !isPerkApplicableToItem(perk, item),
          activationCooldown: abilities.find((a) => a?.ActivationCooldown)?.ActivationCooldown,
          explain: explainPerk({
            perk: perk,
            affixes: affixes,
            abilities: abilities,
            gearScore: itemGS + (getItemGsBonus(perk, item) || 0),
          }),
          explainOld: null
        }
      },
    )

    return result
  })
}

async function fetchAbilities(db: NwData, perk: PerkData) {
  if (!perk?.EquipAbility?.length) {
    return []
  }
  return Promise.all(perk.EquipAbility.map((id) => db.abilitiesById(id)))
}

async function fetchAffixes(db: NwData, perk: PerkData) {
  if (!perk?.Affix?.length) {
    return []
  }
  return Promise.all(perk.Affix.map((id) => db.affixStatsById(id)))
}
