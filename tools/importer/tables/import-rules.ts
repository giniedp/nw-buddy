import * as fs from 'fs'
import * as path from 'path'
import { replaceExtname } from '../../../tools/utils/file-utils'
import { deleteProp, mapProp, mapPropToArray, tableSource } from './types'

const ITEM_CLASS_FIXES = {
  '2hAxe': '2HAxe',
  Greatsword: 'GreatSword',
  Heartgem: 'HeartGem',
  Pickaxe: 'PickAxe',
  spear: 'Spear',
  named: 'Named',
  roundShield: 'RoundShield',
  flail: 'Flail',
  light: 'Light',
  medium: 'Medium',
}

const COMPARE_TYPE_FIXES = {
  LessthanOrEqual: 'LessThanOrEqual'
}

export const TABLE_IMPORT_RULES = [
  tableSource([
    '*_affixdefinitions',
    '*_affixstats',
    '*_afflictions',
    '*_areadefinitions',
    '*_attributeconstitution',
    '*_attributedexterity',
    '*_attributefocus',
    '*_attributeintelligence',
    '*_attributestrength',
    '*_buffbuckets',
    '*_categoricalprogression',
    '*_cooldowns_player',
    '*_crafting',
    '*_craftingcategories',
    '*_damagetable_*',
    '*_damagetable',
    '*_damagetypes',
    '*_dyecolors',
    '*_gameevents',
    '*_gatherables',
    '*_housetypes',
    '*_housingitems',
    '*_itemappearancedefinitions',
    '*_itemdefinitions_ammo',
    '*_itemdefinitions_armor',
    '*_itemdefinitions_consumables',
    '*_itemdefinitions_instrumentsappearances',
    '*_itemdefinitions_master_*',
    '*_itemdefinitions_resources',
    '*_itemdefinitions_runes',
    '*_itemdefinitions_weaponappearances_mountattachments',
    '*_itemdefinitions_weaponappearances',
    '*_itemdefinitions_weapons',
    '*_lootbuckets',
    '*_lootlimits',
    '*_loottables*',
    '*_manacosts_player',
    '*_metaachievements',
    '*_milestonerewards',
    '*_objectives',
    '*_objectivetasks',
    '*_perkbuckets',
    '*_perks',
    '*_spelltable_*',
    '*_spelltable',
    '*_staminacosts_player',
    '*_statuseffectcategories',
    '*_statuseffects_*',
    '*_statuseffects',
    '*_territory_standing',
    '*_territorygovernance',
    '*_tradeskill*',
    '*_vitals_player',
    '*_vitals',
    '*_vitalscategories',
    '*_vitalsleveldata',
    '*_vitalsmodifierdata',
    '*_weaponmastery',
    '*_xpamountsbylevel',
    'arenas/*',
    'charactertables/**/*',
    'costumechanges/*_costumechanges',
    'gamemodemutators/*',
    'generated_*metadata',
    'mounts/*_mounts',
    'mtx/*',
    'pointofinterestdefinitions/*',
    'pvp_rewardstrack/*',
    'pvpbalancetables/*',
    'questgameevents/*',
    'quests/**/*_objectives',
    'weaponabilities/*',
    //'quests/**/*_objectivetasks',
  ]),
  tableSource('javelindata_gamemodes', [
    mapPropToArray({
      keys: ['PossibleItemDropIds', 'PossibleItemDropIdsByLevel01', 'LootTags', 'MutLootTagsOverride'],
      separator: ',',
    }),
  ]),
  tableSource(
    // prettier-ignore
    [
      'vitalstables/*_vitals_*',
      'javelindata_vitals_*',
      'javelindata_vitals',
    ],
    [
      mapPropToArray({
        keys: ['VitalsCategories', 'LootTags'],
        separator: ',',
      }),
      deleteProp([
        'FoodBaseMax',
        'FoodInitial',
        'FoodBaseTickRate',
        'FoodTickDelay',
        'FoodFullyDepletedDelay',
        'FoodLowerThreshold',
        'FoodUpperThreshold',
        'DrinkMin',
        'DrinkInitial',
        'DrinkBaseMax',
        'DrinkBaseTickRate',
        'DrinkTickDelay',
        'DrinkFullyDepletedDelay',
        'DrinkLowerThreshold',
        'DrinkUpperThreshold',
      ]),
    ],
  ),
  tableSource('javelindata_territorydefinitions', [
    mapPropToArray({
      keys: ['LootTags'],
      separator: ',',
    }),
  ]),
  tableSource('gamemodemutators/javelindata_mutationdifficulty', [
    mapPropToArray({
      keys: ['InjectedLootTags'],
      separator: ',',
    }),
  ]),
  tableSource('javelindata_lootbuckets', [
    mapPropToArray({
      keys: [/Tags\d+/i],
      separator: ',',
    }),
    mapProp(/MatchOne\d+/, (value) => {
      if (value === 'TRUE') {
        return true
      }
      if (value === 'FALSE') {
        return false
      }
      return value
    }),
    deleteProp(/Quantity\d+/, (value) => !value),
    deleteProp(/MatchOne\d+/, (value) => !value),
  ]),
  tableSource(
    // prettier-ignore
    [
      'javelindata_loottables*',
      'pvp_rewardstrack/javelindata_loottables*'
  ],
    [
      mapPropToArray({
        keys: ['Conditions'],
        separator: ',',
      }),
    ],
  ),
  tableSource('javelindata_itemdefinitions_consumables', [
    mapPropToArray({
      keys: ['AddStatusEffects', 'RemoveStatusEffectCategories', 'RemoveStatusEffects'],
      separator: '+',
    }),
  ]),
  tableSource('javelindata_itemappearancedefinitions', [
    mapPropToArray({
      keys: ['ItemClass'],
      separator: '+',
      map: (value) => ITEM_CLASS_FIXES[value] || value,
    }),
  ]),

  tableSource('javelindata_itemdefinitions_instrumentsappearances', [
    mapPropToArray({
      keys: ['ItemClass'],
      separator: '+',
      map: (value) => ITEM_CLASS_FIXES[value] || value,
    }),
  ]),

  tableSource(
    // prettier-ignore
    [
      'javelindata_itemdefinitions_weaponappearances',
      'javelindata_itemdefinitions_weaponappearances_mountattachments',
    ],
    [
      mapPropToArray({
        keys: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
      mapProp(['NumberOfHitsComparisonType'], (value: string) => {
        value = value.replace('&#160;', '')
        value = COMPARE_TYPE_FIXES[value] || value
        return value
      }),
    ],
  ),
  tableSource('weaponabilities/*_ability_*', [
    mapProp(['NumberOfHitsComparisonType'], (value: string) => {
      value = value.replace('&#160;', '')
        value = COMPARE_TYPE_FIXES[value] || value
        return value
    }),
    mapPropToArray({
      keys: [
        'AbilityList',
        'AttachedTargetSpellIds',
        'AttackType',
        'DamageTableRow',
        'DamageTableRowOverride',
        'DamageTypes',
        'ManaCostList',
        'RemoteDamageTableRow',
        'RemoveTargetStatusEffectsList',
        'SelfApplyStatusEffect',
        'StaminaCostList',
        'StatusEffectCategories',
        'StatusEffectCategoriesList',
        'StatusEffectDurationCats',
        'StatusEffectsList',
        'TargetStatusEffectCategory',
        'TargetStatusEffectDurationCats',
        'TargetStatusEffectDurationList',
      ],
      separator: ',',
    }),
    mapProp(['Icon'], (value: string) => (value === 'bowAbility5_mod2' ? null : value)),
  ]),

  tableSource(
    // prettier-ignore
    [
      'javelindata_itemdefinitions_master_*',
      'mtx/*_itemdefinitions_mtx_*',
    ],
    [
      mapPropToArray({
        keys: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
      mapPropToArray({
        keys: ['IngredientCategories'],
        separator: ',',
      }),
      deleteProp(['AudioPickup', 'AudioPlace', 'AudioUse', 'AudioCreated']),
    ],
  ),

  tableSource(
    // prettier-ignore
    [
      'javelindata_housingitems',
      'mtx/*_housingitems_mtx',
    ],
    [
      mapPropToArray({
        keys: ['HousingTags'],
        separator: '+',
      }),
    ],
  ),
  tableSource('javelindata_perks', [
    mapPropToArray({
      keys: ['ItemClass'],
      separator: '+',
      map: (value) => ITEM_CLASS_FIXES[value] || value,
    }),
    mapPropToArray({
      keys: ['ExclusiveLabels', 'ExcludeItemClass'],
      separator: '+',
    }),
    mapPropToArray({
      keys: ['EquipAbility'],
      separator: ',',
    }),
  ]),

  tableSource('javelindata_statuseffectcategories', [
    mapProp(['ValueLimits'], (value: string) => {
      return Object.fromEntries(
        value.split(',').map((it) => {
          const [key, value] = it.split(':')
          return [key, Number(value)]
        }),
      )
    }),
  ]),

  tableSource(
    // prettier-ignore
    [
      'javelindata_statuseffects_*',
      'javelindata_statuseffects',
    ],
    [
      mapPropToArray({
        keys: ['EffectCategories', 'RemoveStatusEffectCategories'],
        separator: '+',
      }),
      mapPropToArray({
        keys: ['RemoveStatusEffects', 'EffectDurationMods'],
        separator: /[,+]/,
      }),
    ],
  ),

  tableSource('pointofinterestdefinitions/*', [
    mapPropToArray({
      keys: ['LootTags', 'VitalsCategory'],
      separator: ',',
    }),
  ]),

  tableSource(
    // prettier-ignore
    [
      'javelindata_attributeconstitution',
      'javelindata_attributeintelligence',
      'javelindata_attributestrength',
      'javelindata_attributedexterity',
      'javelindata_attributefocus',
    ],
    [
      mapPropToArray({
        keys: ['EquipAbilities'],
        separator: ',',
      }),
    ],
  ),

  tableSource('*_vitalscategories', [deleteProp('LocStringGenerationHelper')]),

  tableSource(
    ['**/*_itemdefinitions_master_*', '**/*_itemdefinitions_mtx_*'],
    [
      (obj, ctx) => {
        function findIcon(id: string) {
          return (
            ctx.getTable('*_itemappearancedefinitions').find((it) => id === it.ItemID)?.IconPath ||
            ctx.getTable('*_itemdefinitions_weaponappearances').find((it) => id === it.WeaponAppearanceID)?.IconPath ||
            ctx.getTable('*_itemdefinitions_instrumentsappearances').find((it) => id === it.WeaponAppearanceID)
              ?.IconPath
          )
        }
        let candidates = [
          obj.ArmorAppearanceM ? findIcon(obj.ArmorAppearanceM) : null,
          obj.ArmorAppearanceF ? findIcon(obj.ArmorAppearanceF) : null,
          obj.IconPath,
          obj.WeaponAppearanceOverride ? findIcon(obj.WeaponAppearanceOverride) : null,
        ]
        if (obj.ItemType && obj.ArmorAppearanceM) {
          candidates.push(`lyshineui/images/icons/items/${obj.ItemType}/${obj.ArmorAppearanceM}.png`)
        }
        if (obj.ItemType && obj.ArmorAppearanceF) {
          candidates.push(`lyshineui/images/icons/items/${obj.ItemType}/${obj.ArmorAppearanceF}.png`)
        }
        if (obj.ItemType && obj.WeaponAppearanceOverride) {
          candidates.push(`lyshineui/images/icons/items/${obj.ItemType}/${obj.WeaponAppearanceOverride}.png`)
        }

        for (const icon of candidates) {
          if (icon && fs.existsSync(path.join(ctx.inputDir, replaceExtname(icon, '.png')))) {
            obj.IconPath = replaceExtname(icon, '.png')
            return
          }
        }
        obj.IconPath = null
      },
    ],
  ),
]