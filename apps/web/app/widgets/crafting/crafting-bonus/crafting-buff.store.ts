import { inject } from '@angular/core'
import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals'
import {
  getPerkMultiplier,
  getPerkOnlyMultiplier,
  getStatusEffectEXPCategoricalProgression,
  NW_MAX_GEAR_SCORE,
  patchPrecision,
} from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { CraftingTradeskill, PerkData, StatusEffectData } from '@nw-data/generated'
import { CharacterStore, injectNwData, withStateLoader } from '~/data'
import { eqCaseInsensitive } from '~/utils'
import { CraftingBuffCategory, CraftingBuffGroup, CraftingBuffType } from './types'

interface CraftingBuffState {
  buffs: CraftingBuffGroup[]
  //settings: Array<{ id: string; value: number }>
}

export type CraftingBuffStore = InstanceType<typeof CraftingBuffStore>
export const CraftingBuffStore = signalStore(
  { providedIn: 'root' },
  withState<CraftingBuffState>({
    buffs: [],
    //settings: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async () => {
        return {
          //    settings: [],
          buffs: await loadAllBuffs(db),
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
    const char = inject(CharacterStore)
    function getSetting(id: string) {
      return char.getEffectStacks(id) || 0
    }
    function setSetting(id: string, value: number) {
      char.setEffectStacks(id, value)
    }
    return {
      getSetting,
      setSetting,
      getSettingGS: (id: string) => getSetting(`${id}:gs`) ?? NW_MAX_GEAR_SCORE,
      setSettingGS: (id: string, value: number) => setSetting(`${id}:gs`, value),
      clearSettings: () => char.clearEffects(),
      getSkillLevel: (skill: string) => {
        return char.getTradeskillLevel(skill)
      },
      setSkillLevel: (skill: string, value: number) => {
        char.setTradeskillLevel(skill, value)
      },
    }
  }),
  withMethods(({ buffs }) => {
    const char = inject(CharacterStore)
    const settingsMap = char.effectStacksMap
    function getScaleFactor(group: CraftingBuffGroup['group'], type: CraftingBuffType) {
      if (type === 'yld' && group !== 'TerritoryStanding' && group !== 'FactionControl') {
        return 1 / 10000
      }
      return 1
    }

    function sumTerritoryStanding(options: { items: CraftingBuffCategory[]; includeFaction: boolean }) {
      let fortItems: CraftingBuffCategory[] = []
      let buffItems: CraftingBuffCategory[] = options.items
      if (!buffItems) {
        buffItems = buffs().find((it) => it.group === 'TerritoryStanding' && it.buffType === 'exp')?.items
      }
      if (options.includeFaction) {
        fortItems = buffs().find((it) => it.group === 'FactionControl' && it.buffType === 'exp')?.items
      }
      const music = sumBuffs({
        items: buffItems.filter((it) => it.category.startsWith('musicbuff')),
        settings: settingsMap(),
      })
      const bag = sumBuffs({
        items: buffItems.filter((it) => it.category.startsWith('bag')),
        settings: settingsMap(),
      })
      const token = sumBuffs({
        items: buffItems.filter((it) => it.category.startsWith('token')),
        settings: settingsMap(),
      })
      const fort = sumBuffs({
        items: fortItems,
        settings: settingsMap(),
      })
      const cards = 0
      return (1 + Math.max(bag, music)) * (1 + cards) * (1 + token + fort) - 1
    }

    function sumBonusCategories({
      group,
      type,
      items,
      includeFaction,
    }: {
      group: CraftingBuffGroup['group']
      type: CraftingBuffType
      items: CraftingBuffCategory[]
      includeFaction: boolean
    }) {
      if (group === 'TerritoryStanding' && type === 'exp') {
        return sumTerritoryStanding({
          items: items,
          includeFaction,
        })
      }
      const scale = getScaleFactor(group, type)
      const value =
        sumBuffs({
          items: items,
          settings: settingsMap(),
        }) * scale
      if (!includeFaction || group === 'FactionControl') {
        return value
      }

      const factionItems = buffs().find((it) => it.group === 'FactionControl' && it.buffType === type)?.items
      const actionValue = sumBuffs({
        items: factionItems,
        settings: settingsMap(),
      })
      return value + actionValue
    }

    return {
      sumBonusCategories,
      sumBonus(group: CraftingBuffGroup['group'], type: CraftingBuffType, includeFaction: boolean) {
        if (!group) {
          return 0
        }
        return sumBonusCategories({
          group,
          type,
          items: buffs()?.find((it) => it.group === group && it.buffType === type)?.items || [],
          includeFaction,
        })
      },
    }
  }),
  withMethods(({ sumBonus }) => {
    return {
      getTradeskillBonusForGS(tradeskill: CraftingTradeskill) {
        const buffs = sumBonus(tradeskill, 'gs', false)
        const fort = sumBonus('FactionControl', 'gs', false)
        const total = buffs + fort
        return {
          buffs,
          fort,
          total,
        }
      },
      getTradeskillBonusForYield(tradeskill: CraftingTradeskill) {
        const buffs = sumBonus(tradeskill, 'yld', false)
        const fort = sumBonus('FactionControl', 'yld', false)
        const total = buffs + fort
        return {
          buffs,
          fort,
          total,
        }
      },
      getTerritoryBonusForEXP() {
        return sumBonus('TerritoryStanding', 'exp', true)
      },
    }
  }),
)

const ITEM_CLASS_PRESETS: Record<string, { name: string; maxStack: number }> = {
  armor: {
    name: 'ui_armor',
    maxStack: 5,
  },
  equippabletoken: {
    name: 'ui_itemtypedescription_earringjewelry',
    maxStack: 1,
  },
  bag: {
    name: 'categorydata_bags',
    maxStack: 3,
  },
}

type ValueGetter<T> = (effect: T) => number | Promise<number>

function loadAllBuffs(db: NwData): Promise<CraftingBuffGroup[]> {
  return Promise.all([
    loadSkillBuffs(db, {
      skill: 'Arcana',
      type: 'gs',
      getEffectValue: effectValueGetter('MaxGSArcana'),
    }),
    loadSkillBuffs(db, {
      skill: 'Armoring',
      type: 'gs',
      getEffectValue: effectValueGetter('MaxGSArmoring'),
    }),
    loadSkillBuffs(db, {
      skill: 'Engineering',
      type: 'gs',
      getEffectValue: effectValueGetter('MaxGSEngineering'),
    }),
    loadSkillBuffs(db, {
      skill: 'Weaponsmithing',
      type: 'gs',
      getEffectValue: effectValueGetter('MaxGSWeaponsmithing'),
    }),
    loadSkillBuffs(db, {
      skill: 'Jewelcrafting',
      type: 'gs',
      getEffectValue: effectValueGetter('MaxGSJewelcrafting'),
    }),
    loadSkillBuffs(db, {
      skill: 'Jewelcrafting',
      type: 'yld',
      getEffectValue: effectValueGetter('ROLJewelcrafting'),
    }),
    loadSkillBuffs(db, {
      skill: 'Cooking',
      type: 'yld',
      getEffectValue: effectValueGetter('ROLCooking'),
    }),
    loadSkillBuffs(db, {
      skill: 'Smelting',
      type: 'yld',
      getEffectValue: effectValueGetter('ROLSmelting'),
    }),
    loadSkillBuffs(db, {
      skill: 'Stonecutting',
      type: 'yld',
      getEffectValue: effectValueGetter('ROLStonecutting'),
    }),
    loadSkillBuffs(db, {
      skill: 'Leatherworking',
      type: 'yld',
      getEffectValue: effectValueGetter('ROLLeatherworking'),
    }),
    loadSkillBuffs(db, {
      skill: 'Weaving',
      type: 'yld',
      getEffectValue: effectValueGetter('ROLWeaving'),
    }),
    loadSkillBuffs(db, {
      skill: 'Woodworking',
      type: 'yld',
      getEffectValue: effectValueGetter('ROLWoodworking'),
    }),
    loadStandingBuffs(db),
    loadFactionBuffs(db, { type: 'gs', buffId: 'Crafting_Max_GS_Bonus' }),
    loadFactionBuffs(db, { type: 'yld', buffId: 'Crafting_Refining_Yield_Modifier' }),
    loadFactionBuffs(db, { type: 'exp', buffId: 'Progression_Global_Modifier' }),
  ])
}

async function loadFactionBuffs(
  db: NwData,
  { type, buffId }: { type: CraftingBuffType; buffId: string },
): Promise<CraftingBuffGroup> {
  const buff = await db.factionControlBuffsById(buffId)
  const territory = await db.territoriesByFactionControlBuff(buffId).then((it) => it?.[0])
  return {
    group: 'FactionControl',
    name: 'Faction Control',
    buffType: type,
    items: [
      {
        category: buffId,
        name: territory?.NameLocalizationKey || buffId,
        maxStack: 1,
        items: [
          {
            setting: buffId,
            name: buff.Name,
            description: buff.Description,
            icon: 'assets/icons/icon_map_fort.png',
            scalingPerGS: null,
            value: buff.Value,
          },
        ],
      },
    ],
  }
}

function effectValueGetter(key: keyof StatusEffectData): ValueGetter<StatusEffectData> {
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
    if (Number.isFinite(value)) {
      return value
    }
  }
  if (effect.TerritoryStandingMod) {
    return effect.TerritoryStandingMod
  }
  return null
}

async function loadStandingBuffs(db: NwData): Promise<CraftingBuffGroup> {
  return {
    group: 'TerritoryStanding',
    name: 'Territory Standing',
    buffType: 'exp',
    items: await loadBuffs(db, {
      getEffectValue: standingExpValueGetter,
      getPerkValue: async (perk) => {
        if (perk.Affix) {
          const affix = await db.affixStatsById(perk.Affix)
          return affix?.TerritoryStandingMod
        }
        return null
      },
    }),
  }
}

async function loadSkillBuffs(
  db: NwData,
  {
    skill,
    type,
    getEffectValue,
  }: {
    skill: CraftingTradeskill
    type: CraftingBuffType
    getEffectValue: ValueGetter<StatusEffectData>
  },
): Promise<CraftingBuffGroup> {
  return {
    group: skill,
    name: skill,
    buffType: type,
    items: [
      ...(await loadBuffs(db, { getEffectValue })),
      // {
      //   category: 'custom',
      //   name: 'Custom',
      //   maxStack: 1,
      //   items: [
      //     {
      //       id: 'custom',
      //       name: 'Custom',
      //       description: null,
      //       icon: null,
      //       value: 0,
      //       scalingPerGS: null,
      //     }
      //   ],
      // }
    ],
  }
}

async function loadBuffs(
  db: NwData,
  {
    getEffectValue,
    getPerkValue,
  }: {
    getEffectValue?: ValueGetter<StatusEffectData>
    getPerkValue?: ValueGetter<PerkData>
  },
): Promise<CraftingBuffCategory[]> {
  const categories: Record<string, CraftingBuffCategory> = {}

  const effects = getEffectValue ? await db.statusEffectsAll() : []
  for (const effect of effects) {
    const value = patchPrecision(await getEffectValue(effect))
    if (!value || typeof value !== 'number') {
      continue
    }

    if (effect.StatusID.match(/LSB$/i)) {
      const group = 'townbuff'
      categories[group] ||= {
        category: group,
        name: 'Town Buff',
        items: [],
        maxStack: effect.StackMax ?? 1,
      }
      categories[group].items.push({
        setting: effect.StatusID.toLowerCase(),
        name: effect.DisplayName,
        description: effect.Description,
        icon: effect.PlaceholderIcon,
        value,
        scalingPerGS: null,
      })
      continue
    }
    if (effect.StatusID.match(/^Token_/i)) {
      const group = 'token'
      categories[group] ||= {
        category: group,
        name: 'Booster',
        items: [],
        maxStack: effect.StackMax ?? 1,
      }
      categories[group].items.push({
        setting: effect.StatusID.toLowerCase(),
        name: effect.DisplayName,
        description: effect.Description,
        icon: effect.PlaceholderIcon,
        value,
        scalingPerGS: null,
      })
      continue
    }

    if (effect.EffectCategories?.some((it) => eqCaseInsensitive(it, 'musicbuff'))) {
      const group = 'musicbuff'
      categories[group] ||= {
        category: group,
        name: 'Music Buff',
        items: [],
        maxStack: effect.StackMax ?? 1,
      }
      categories[group].items.push({
        setting: effect.StatusID.toLowerCase(),
        name: effect.DisplayName,
        description: effect.Description,
        icon: effect.PlaceholderIcon,
        value,
        scalingPerGS: null,
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
        categories[group] ||= {
          category: group,
          name: 'ui_consumable',
          items: [],
          maxStack: effect.StackMax ?? 1,
        }
        categories[group].items.push({
          setting: effect.StatusID.toLowerCase(),
          name: item.Name,
          description: effect.Description,
          icon: item.IconPath,
          value,
          scalingPerGS: null,
        })
        continue
      }
      continue
    }

    const housingItem = await db.housingItemsByStatusEffect(effect.StatusID)
    if (housingItem?.length) {
      for (const item of housingItem) {
        const group = 'trophy'
        categories[group] ||= {
          category: group,
          name: 'ui_trophies',
          items: [],
          maxStack: effect.StackMax ?? 1,
        }
        categories[group].items.push({
          setting: effect.StatusID.toLowerCase(),
          name: item.Name,
          description: item.Description,
          icon: item.IconPath,
          value,
          scalingPerGS: null,
        })
        continue
      }
      continue
    }

    const affixes = await db.affixByStatusEffect(effect.StatusID)
    if (affixes?.length) {
      for (const affix of affixes) {
        for (const perk of (await db.perksByAffix(affix.StatusID)) || []) {
          if (!perk.ItemClass) {
            continue
          }
          const group = perk.ItemClass[0].toLowerCase()
          categories[group] ||= {
            category: group,
            name: group,
            items: [],
            maxStack: effect.StackMax ?? 1,
          }
          const preset = ITEM_CLASS_PRESETS[group]
          if (preset) {
            categories[group].name = preset.name
            categories[group].maxStack = Math.min(categories[group].maxStack, preset.maxStack)
          }

          categories[group].items.push({
            setting: effect.StatusID.toLowerCase(),
            name: perk.DisplayName,
            description: perk.Description,
            icon: perk.IconPath,
            value,
            scalingPerGS: perk.ScalingPerGearScore,
          })
        }
      }
      continue
    }
  }
  const perks = getPerkValue ? await db.perksAll() : []
  for (const perk of perks) {
    if (!perk.ItemClass) {
      continue
    }
    const value = patchPrecision(await getPerkValue(perk))
    if (!value || typeof value !== 'number') {
      continue
    }

    const group = perk.ItemClass[0].toLowerCase()
    categories[group] ||= {
      category: group,
      name: group,
      items: [],
      maxStack: 1,
    }
    const preset = ITEM_CLASS_PRESETS[group]
    if (preset) {
      categories[group].name = preset.name
      categories[group].maxStack = preset.maxStack
    }
    categories[group].items.push({
      setting: perk.PerkID.toLowerCase(),
      name: perk.DisplayName,
      description: perk.Description,
      icon: perk.IconPath,
      value,
      scalingPerGS: perk.ScalingPerGearScore,
    })
  }

  const result = Object.values(categories)
  result.sort((a, b) => a.category.localeCompare(b.category))
  for (const group of result) {
    group.items.sort((a, b) => a.setting.localeCompare(b.setting))
  }
  return result
}

function sumBuffs({
  items,
  settings,
}: {
  items: CraftingBuffCategory[]
  settings: ReadonlyMap<string, number>
}): number {
  if (!items?.length || !settings) {
    return 0
  }
  let result = 0
  for (const { items: buffs, maxStack } of items) {
    let stackCount = 0
    for (const { setting: id, value, scalingPerGS: scalingPerGearscore } of buffs) {
      let scale = 1
      let toStack = settings.get(id)
      if (!toStack || typeof toStack !== 'number') {
        continue
      }
      if (scalingPerGearscore) {
        scale = getPerkOnlyMultiplier(
          {
            ScalingPerGearScore: scalingPerGearscore,
          },
          settings.get(`${id}:gs`) ?? NW_MAX_GEAR_SCORE,
        )
      }

      while (toStack > 0 && stackCount < maxStack) {
        result += value * scale
        stackCount++
        toStack--
      }
    }
  }
  return result
}
