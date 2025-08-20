import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, HostBinding, inject } from '@angular/core'
import { explainPerk, getItemGsBonus, getPerkTypeWeight, isPerkApplicableToItem } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { PerkData } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgEllipsisVertical } from '~/ui/icons/svg'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { apiResource } from '~/utils'
import { ItemDetailStore } from './item-detail.store'
import { ItemEditorEventsService } from './item-editor-events.service'
import { PerkSlotExplained } from './selectors'

@Component({
  selector: 'nwb-item-detail-perks',
  templateUrl: './item-detail-perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, ItemFrameModule, IconsModule, TooltipModule],
  host: {
    class: 'flex flex-col gap-1',
    'animate.enter': 'fade-grow-y-in',
    'animate.leave': 'fade-grow-y-out',
    '[class.hidden]': 'isHidden()',
  },
})
export class ItemDetailPerksComponent {
  private db = injectNwData()
  private store = inject(ItemDetailStore)
  private events = inject(ItemEditorEventsService, { optional: true })
  protected slots = this.store.itemPerkSlots
  protected editable = this.store.perkEditable

  protected iconEdit = svgEllipsisVertical
  protected iconWarn = svgCircleExclamation

  protected isHidden = computed(() => {
    return !this.rows()?.length
  })

  private resource = apiResource({
    request: () => this.slots() || [],
    loader: async ({ request }) => {
      return Promise.all(
        request.map(async (slot) => {
          return {
            ...slot,
            abilities: await fetchAbilities(this.db, slot.perk),
            affix: await fetchAffix(this.db, slot.perk),
          }
        }),
      )
    },
  })

  protected rows = computed(() => {
    const item = this.store.item()
    const itemGS = this.store.itemGS()
    const slots = this.resource.value() || []
    const result = slots.map(
      ({ key, perkId, perk, editable, bucketId, bucket, abilities, affix }): PerkSlotExplained => {
        return {
          key: key,
          perkId: perkId,
          perk: perk,
          bucketId: bucketId,
          bucket: bucket,
          editable: editable,
          violatesExclusivity: false,
          violatesItemClass: !!perk && !isPerkApplicableToItem(perk, item),
          activationCooldown: abilities.find((a) => a?.ActivationCooldown)?.ActivationCooldown,
          explain: explainPerk({
            perk: perk,
            affix: affix,
            abilities: abilities,
            gearScore: itemGS + (getItemGsBonus(perk, item) || 0),
          }),
        }
      },
    )
    result.sort((a, b) => {
      return getPerkTypeWeight(a.perk?.PerkType) - getPerkTypeWeight(b.perk?.PerkType)
    })
    for (const slot of result) {
      const labels = slot.perk?.ExclusiveLabels
      if (!labels?.length) {
        continue
      }
      for (const other of result) {
        if (other === slot) {
          continue
        }
        const otherLabels = other.perk?.ExclusiveLabels
        if (!otherLabels?.length) {
          continue
        }
        if (labels.some((it) => otherLabels.includes(it))) {
          slot.violatesExclusivity = true
          break
        }
      }
    }
    return result
  })

  protected async editPerkClicked(slot: PerkSlotExplained) {
    if (this.isSlotEditable(slot) && this.events) {
      this.events.editPerk.next(slot)
    }
  }

  protected isSlotEditable(slot: PerkSlotExplained) {
    return this.editable() && !!slot?.editable
  }

  protected buildTextContext(perkId: string, gs: number, context: Record<string, any>) {
    return { itemId: perkId, gearScore: gs, ...(context || {}) }
  }
}

async function fetchAbilities(db: NwData, perk: PerkData) {
  if (!perk?.EquipAbility?.length) {
    return []
  }
  return Promise.all(perk.EquipAbility.map((id) => db.abilitiesById(id)))
}

async function fetchAffix(db: NwData, perk: PerkData) {
  if (!perk?.Affix) {
    return null
  }
  return db.affixStatsById(perk.Affix)
}
