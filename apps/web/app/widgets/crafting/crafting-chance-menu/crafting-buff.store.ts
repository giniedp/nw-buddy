import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import { getStatusEffectEXPCategoricalProgression, patchPrecision } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { CraftingTradeskill, StatusEffectData } from '@nw-data/generated'
import { injectNwData, withStateLoader } from '~/data'
import { eqCaseInsensitive } from '~/utils'

export type CraftingBuffTarget = CraftingTradeskill | 'Standing'
interface CraftingBuffState {
  buffs: Record<CraftingBuffTarget, CraftingBuffGroup[]>
  stacks: Record<string, Record<string, number>>
}

export type CraftingBuffStore = InstanceType<typeof CraftingBuffStore>
export const CraftingBuffStore = signalStore(
  { providedIn: 'root' },
  withState<CraftingBuffState>({
    buffs: null,
    stacks: null,
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async () => {
        return {
          stacks: {},
          buffs: {
            Arcana: await loadBuffs(db, commonBuffValueGetter('MaxGSArcana')),
            Armoring: await loadBuffs(db, commonBuffValueGetter('MaxGSArmoring')),
            Engineering: await loadBuffs(db, commonBuffValueGetter('MaxGSEngineering')),
            Jewelcrafting: await loadBuffs(db, commonBuffValueGetter('MaxGSJewelcrafting')),
            Weaponsmithing: await loadBuffs(db, commonBuffValueGetter('MaxGSWeaponsmithing')),

            Cooking: await loadBuffs(db, commonBuffValueGetter('ROLCooking')),
            Smelting: await loadBuffs(db, commonBuffValueGetter('ROLSmelting')),
            Stonecutting: await loadBuffs(db, commonBuffValueGetter('ROLStonecutting')),
            Leatherworking: await loadBuffs(db, commonBuffValueGetter('ROLLeatherworking')),
            Weaving: await loadBuffs(db, commonBuffValueGetter('ROLWeaving')),
            Woodworking: await loadBuffs(db, commonBuffValueGetter('ROLWoodworking')),

            Fishing: [],
            Furnishing: [],
            Harvesting: [],
            Logging: [],
            Mining: [],
            Musician: [],
            Skinning: [],

            Standing: await loadBuffs(db, standingExpValueGetter).then((res) => {
              console.log(res)
              return res
            }),
          },
        }
      },
    }
  }),
  withHooks({
    onInit: (state) => {
      state.load()
    },
  }),
  withMethods((state) => {
    return {
      getBuffValue(tradeskill: CraftingBuffTarget) {
        const buffs = state.buffs()
        const stacks = state.stacks()
        return sumBuffValues(buffs?.[tradeskill], stacks?.[tradeskill])
      },
      getBuffStacks(tradeskill: CraftingBuffTarget, effect: string) {
        const stacks = state.stacks()
        return stacks?.[tradeskill]?.[effect] || 0
      },
      setBuffStacks(tradeskill: CraftingBuffTarget, effect: string, value: number) {
        patchState(state, ({ stacks }) => {
          return {
            stacks: {
              ...stacks,
              [tradeskill]: {
                ...stacks?.[tradeskill],
                [effect]: value,
              },
            },
          }
        })
      },
    }
  }),
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

const ITEM_CLASS_PRESETS: Record<string, { name: string; maxStack: number }> = {
  armor: {
    name: 'ui_armor',
    maxStack: 5,
  },
  equippabletoken: {
    name: 'ui_itemtypedescription_earringjewelry',
    maxStack: 1,
  },
}

type EffectValueGetter = (effect: StatusEffectData) => number

function commonBuffValueGetter(key: keyof StatusEffectData): EffectValueGetter {
  return (effect: StatusEffectData) => effect[key] as number
}

function standingExpValueGetter(effect: StatusEffectData): number {
  if (effect.EXPCategoricalProgression) {
    const categories = getStatusEffectEXPCategoricalProgression(effect)
    const category = categories.find((it) => it.category.match(/^\d+$/))
    if (!category) {
      return null
    }
    const value = Number(category?.value)
    console.log(category, value)
    if (Number.isFinite(value)) {
      return value
    }
  }
  if (effect.TerritoryStandingMod) {
    return effect.TerritoryStandingMod
  }
  return null
}

async function loadBuffs(db: NwData, getter: EffectValueGetter): Promise<CraftingBuffGroup[]> {
  const groups: Record<string, CraftingBuffGroup> = {}

  const effects = await db.statusEffectsAll()
  for (const effect of effects) {
    const value = patchPrecision(getter(effect))
    if (!value || typeof value !== 'number') {
      continue
    }

    if (effect.StatusID.match(/LSB$/i)) {
      const group = 'townbuff'
      groups[group] ||= {
        id: group,
        name: 'Town Buff',
        buffs: [],
        stack: effect.StackMax ?? 1,
      }
      groups[group].buffs.push({
        effect: effect.StatusID.toLowerCase(),
        name: effect.DisplayName,
        description: effect.Description,
        icon: effect.PlaceholderIcon,
        value,
      })
      continue
    }
    if (effect.StatusID.match(/^Token_/i)) {
      const group = 'token'
      groups[group] ||= {
        id: group,
        name: 'Booster',
        buffs: [],
        stack: effect.StackMax ?? 1,
      }
      groups[group].buffs.push({
        effect: effect.StatusID.toLowerCase(),
        name: effect.DisplayName,
        description: effect.Description,
        icon: effect.PlaceholderIcon,
        value,
      })
      continue
    }

    if (effect.EffectCategories?.some((it) => eqCaseInsensitive(it, 'musicbuff'))) {
      const group = 'musicbuff'
      groups[group] ||= {
        id: group,
        name: 'Music Buff',
        buffs: [],
        stack: effect.StackMax ?? 1,
      }
      groups[group].buffs.push({
        effect: effect.StatusID.toLowerCase(),
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
          name: 'ui_consumable',
          buffs: [],
          stack: effect.StackMax ?? 1,
        }
        groups[group].buffs.push({
          effect: effect.StatusID.toLowerCase(),
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
          name: 'ui_trophies',
          buffs: [],
          stack: effect.StackMax ?? 1,
        }
        groups[group].buffs.push({
          effect: effect.StatusID.toLowerCase(),
          name: item.Name,
          description: item.Description,
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
          const group = perk.ItemClass[0].toLowerCase()
          groups[group] ||= {
            id: group,
            name: group,
            buffs: [],
            stack: effect.StackMax ?? 1,
          }
          const preset = ITEM_CLASS_PRESETS[group]
          if (preset) {
            groups[group].name = preset.name
            groups[group].stack = Math.min(groups[group].stack, preset.maxStack)
          }

          groups[group].buffs.push({
            effect: effect.StatusID.toLowerCase(),
            name: perk.DisplayName,
            description: perk.Description,
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

function sumBuffValues(groups: CraftingBuffGroup[], stacks: Record<string, number>): number {
  if (!groups?.length || !stacks) {
    return 0
  }
  let result = 0
  for (const { buffs, stack } of groups) {
    let stackCount = 0
    for (const { effect, value } of buffs) {
      let toStack = stacks[effect]
      if (!toStack || typeof toStack !== 'number') {
        continue
      }
      while (toStack > 0 && stackCount < stack) {
        result += value
        stackCount++
        toStack--
      }
    }
  }
  return result
}
