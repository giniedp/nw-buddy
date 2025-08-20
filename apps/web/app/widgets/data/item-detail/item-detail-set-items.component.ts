import { Component, computed, HostBinding, inject } from '@angular/core'
import { RouterModule } from '@angular/router'
import {
  getFirstItemClassOf,
  getItemRarity,
  getItemSetFamilyName,
  getItemVersionString,
  isItemNamed,
} from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { ItemFrameModule } from '~/ui/item-frame'
import { TooltipModule } from '~/ui/tooltip'
import { apiResource } from '~/utils'
import { ItemDetailStore } from './item-detail.store'

@Component({
  selector: 'nwb-item-detail-set-items',
  template: `
    @for (group of groups(); track group.label) {
      <div animate.enter="fade-grow-y-in" animate.leave="fade-grow-y-out">
        <h3 class="font-bold mb-1">{{ group.label }}</h3>
        <div class="flex flex-row flex-wrap gap-1">
          @for (item of group.items; track $index) {
            <a
              [tooltip]="item.ItemTypeDisplayName | nwText"
              [tooltipClass]="'bg-base-200'"
              [nwbItemIcon]="item"
              [rarity]="itemRarity(item)"
              [isNamed]="itemNamed(item)"
              [solid]="true"
              [routerLink]="['item', item.ItemID] | nwLink"
              [routerLinkActive]="['outline']"
              [queryParamsHandling]="'preserve'"
              class="w-full max-w-[42px] aspect-square outline-primary outline-offset-1 outline-1"
            >
            </a>
          }
        </div>
      </div>
    }
  `,
  imports: [NwModule, ItemFrameModule, TooltipModule, RouterModule],
  host: {
    class: 'block relative',
  },
})
export class ItemDetailSetItemsComponent {
  private db = injectNwData()
  private store = inject(ItemDetailStore)

  protected isHidden = computed(() => !this.groups()?.length)

  protected resource = apiResource({
    request: () => {
      return {
        item: this.store.item(),
        name: getItemSetFamilyName(this.store.item()),
      }
    },
    loader: async ({ request }) => {
      const items = await this.db.itemsBySetFamilyName(request.name)
      return selectItemSet(request.item, items)
    },
  })
  protected groups = computed(() => {
    const result: Array<{ label: string; items: MasterItemDefinitions[] }> = []
    const collection = this.resource.value()
    if (!collection) {
      return result
    }
    if (collection.items?.length > 1) {
      result.push({ label: 'Set Items', items: collection.items })
    }
    if (collection.variants?.length > 1) {
      result.push({ label: 'Variants', items: collection.variants })
    }
    if (collection.tiers?.length > 1) {
      result.push({ label: 'Tiers Variants', items: collection.tiers })
    }
    return result
  })
  protected itemRarity(item: MasterItemDefinitions) {
    return getItemRarity(item)
  }
  protected itemNamed(item: MasterItemDefinitions) {
    return isItemNamed(item)
  }
}

export interface ItemCollections {
  items?: MasterItemDefinitions[]
  tiers?: MasterItemDefinitions[]
  variants?: MasterItemDefinitions[]
}

function selectItemSet(item: MasterItemDefinitions, itemsSet: MasterItemDefinitions[]): ItemCollections {
  if (!item || !itemsSet) {
    return null
  }

  // console.log({
  //   item,
  //   itemsSet: Array.from(itemsSet?.values()),
  // })

  const meta = getItemMeta(item)
  const items = itemsSet.map(getItemMeta).filter((it) => !!it)

  // console.log({ items })
  if (!meta?.mainCategory) {
    return null
  }

  if (meta.mainCategory === 'Resource') {
    return {
      tiers: items.filter((it) => it.mainCategory === meta.mainCategory).map((it) => it.item),
    }
  }

  const itemSet = items.filter((it) => {
    return (
      it.subCategory === meta.subCategory &&
      it.version === meta.version &&
      it.tier === meta.tier &&
      it.rarity === meta.rarity
    )
  })
  const tierVariants = items.filter((it) => {
    return (
      it.mainCategory === meta.mainCategory &&
      it.subCategory === meta.subCategory &&
      it.version === meta.version &&
      it.rarity === meta.rarity
    )
  })
  const variants = items.filter((it) => {
    return it.mainCategory === meta.mainCategory && it.subCategory === meta.subCategory && it.tier === meta.tier
  })

  // console.log({ gearset, tierVariants, variants })
  if (itemSet.length === 1 && tierVariants.length === 1 && variants.length === 1) {
    return null
  }
  return {
    items: itemSet.map((it) => it.item),
    tiers: tierVariants.map((it) => it.item),
    variants: variants.map((it) => it.item),
  }
}

function getItemMeta(item: MasterItemDefinitions) {
  const armorClass = getFirstItemClassOf(item, [
    'EquippableChest',
    'EquippableFeet',
    'EquippableHands',
    'EquippableHead',
    'EquippableLegs',
  ])
  if (armorClass) {
    return {
      item: item,
      version: getItemVersionString(item),
      tier: item.Tier,
      rarity: getItemRarity(item),
      subCategory: getFirstItemClassOf(item, ['Light', 'Medium', 'Heavy']),
      mainCategory: armorClass,
    }
  }
  const weaponClass = getFirstItemClassOf(item, ['EquippableMainHand', 'EquippableTwoHand', 'EquippableOffHand'])
  if (weaponClass) {
    return {
      item: item,
      version: getItemVersionString(item),
      tier: item.Tier,
      rarity: getItemRarity(item),
      subCategory: 'weapon',
      mainCategory: getFirstItemClassOf(item, [
        '2HAxe',
        '2HHammer',
        'Axe',
        'Blunderbuss',
        'Bow',
        'FireStaff',
        'Flail',
        'GreatSword',
        'Hatchet',
        'IceMagic',
        'KiteShield',
        'LifeStaff',
        'Musket',
        'Rapier',
        'RoundShield',
        'Spear',
        'Sword',
        'TowerShield',
        'VoidGauntlet',
      ]),
    }
  }
  const jevleryClass = getFirstItemClassOf(item, ['EquippableAmulet', 'EquippableRing', 'EquippableToken'])
  if (jevleryClass) {
    return {
      item: item,
      version: getItemVersionString(item),
      tier: item.Tier,
      rarity: getItemRarity(item),
      subCategory: 'jevlery',
      mainCategory: jevleryClass,
    }
  }
  const resourceClass = getFirstItemClassOf(item, ['Resource'])
  if (resourceClass) {
    return {
      item: item,
      version: getItemVersionString(item),
      tier: item.Tier,
      rarity: getItemRarity(item),
      subCategory: resourceClass,
      mainCategory: resourceClass,
    }
  }
  return null
}
