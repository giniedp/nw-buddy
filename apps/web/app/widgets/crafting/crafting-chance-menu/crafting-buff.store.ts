import { Injectable } from '@angular/core'
import { signalStore, withState } from '@ngrx/signals'
import { NwData } from '@nw-data/db'
import { CraftingTradeskill, StatusEffectData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'

interface CraftingBuffState {
  buffs: Record<CraftingTradeskill, CraftingBuffGroup[]>
}

export type CraftingBuffStore = InstanceType<typeof CraftingBuffStore>
export const CraftingBuffStore = signalStore(
  withState<CraftingBuffState>({
    buffs: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async () => {
        return {
          buffs: {
            Arcana: await loadBuffs(db, 'MaxGSArcana'),
            Armoring: await loadBuffs(db, 'MaxGSArmoring'),
            Engineering: await loadBuffs(db, 'MaxGSEngineering'),
            Jewelcrafting: await loadBuffs(db, 'MaxGSJewelcrafting'),
            Weaponsmithing: await loadBuffs(db, 'MaxGSWeaponsmithing'),

            Cooking: await loadBuffs(db, 'ROLCooking'),
            Smelting: await loadBuffs(db, 'ROLSmelting'),
            Stonecutting: await loadBuffs(db, 'ROLStonecutting'),
            Leatherworking: await loadBuffs(db, 'ROLLeatherworking'),
            Weaving: await loadBuffs(db, 'ROLWeaving'),
            Woodworking: await loadBuffs(db, 'ROLWoodworking'),

            Fishing: [],
            Furnishing: [],
            Harvesting: [],
            Logging: [],
            Mining: [],
            Musician: [],
            Skinning: [],
          }
        }
      }
    }
  })
)

export interface CraftingBuffGroup {
  id: string
  name: string
  buffs: CraftingBuffEntry[]
  stack: number
}

export interface CraftingBuffEntry {
  effect: string
  name: string
  description: string
  icon: string
  value: number
}

async function loadBuffs(db: NwData, key: keyof StatusEffectData): Promise<CraftingBuffGroup[]> {
  const groups: Record<string, CraftingBuffGroup> = {}

  const effects = await db.statusEffectsAll()
  for (const effect of effects) {
    const value = effect[key]
    if (!value || typeof value !== 'number') {
      continue
    }

    if (effect.StatusID.match(/LSB$/i)) {
      const group = 'townBuff'
      groups[group] ||= {
        id: group,
        name: 'Town Buff',
        buffs: [],
        stack: effect.StackMax ?? 1,

      }
      groups[group].buffs.push({
        effect: effect.StatusID,
        name: effect.DisplayName,
        description: effect.Description,
        icon: effect.PlaceholderIcon,
        value,
      })
      continue
    }

    const consumables = await db.consumableItemsByAddStatusEffects(effect.StatusID)
    if (consumables?.length) {
      for (const consumable of consumables) {
        const item = await db.itemOrHousingItem(consumable.ConsumableID)
        if (!item) {
          continue
        }
        const group = 'food'
        groups[group] ||= {
          id: group,
          name: 'Food',
          buffs: [],
          stack: effect.StackMax ?? 1,
        }
        groups[group].buffs.push({
          effect: effect.StatusID,
          name: item.Name,
          description: effect.Description,
          icon: item.IconPath,
          value,
        })
        continue
      }
      continue
    }

    const housingItem = await db.housingItemsByStatusEffect(effect.StatusID)
    if (housingItem?.length) {
      for (const item of housingItem) {
        const group = 'trophy'
        groups[group] ||= {
          id: group,
          name: 'Trophy',
          buffs: [],
          stack: effect.StackMax ?? 1,
        }
        groups[group].buffs.push({
          effect: effect.StatusID,
          name: item.Name,
          description: effect.Description,
          icon: item.IconPath,
          value,
        })
        continue
      }
      continue
    }

    const affixes = await db.affixByStatusEffect(effect.StatusID)
    if (affixes?.length) {
      for (const affix of affixes) {
        for (const perk of (await db.perksByAffix(affix.StatusID)) || []) {
          const group = perk.ItemClass[0]
          groups[group] ||= {
            id: group,
            name: group,
            buffs: [],
            stack: effect.StackMax ?? 1,
          }
          groups[group].buffs.push({
            effect: effect.StatusID,
            name: perk.DisplayName,
            description: effect.Description,
            icon: perk.IconPath,
            value,
          })
        }
      }
      continue
    }
  }
  const result = Object.values(groups)
  result.sort((a, b) => a.id.localeCompare(b.id))
  for (const group of result) {
    group.buffs.sort((a, b) => a.effect.localeCompare(b.effect))
  }
  return result
}
