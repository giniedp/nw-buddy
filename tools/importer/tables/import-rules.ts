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
  LessthanOrEqual: 'LessThanOrEqual',
}

const STATUS_EFFECT_CAT_FIXES = {
  // there is DoT and Dot, normalize to Dot
  DoT: 'Dot',
}

export const TABLE_IMPORT_RULES = [
  tableSource([
    '*_achievements',
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
    '*_crafting_*',
    '*_crafting',
    '*_craftingcategories',
    '*_damagetable_*',
    '*_damagetable',
    '*_damagetypes',
    '*_darknessdefinitions',
    '*_dyecolors',
    '*_emotedefinitions',
    '*_entitlements',
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
    '*_itemtransformdata',
    '*_lootbuckets_pvp',
    '*_lootbuckets',
    '*_lootlimits',
    '*_loottables*',
    '*_loreitems*',
    '*_manacosts_player',
    '*_metaachievements',
    '*_milestonerewards',
    '*_objectives',
    '*_objectivetasks',
    '*_perkbuckets',
    '*_perks',
    '*_playertitles_categories',
    '*_playertitles',
    '*_pvp_rank.json',
    '*_spelltable_*',
    '*_spelltable',
    '*_staminacosts_player',
    '*_statuseffectcategories',
    '*_statuseffects_*',
    '*_statuseffects',
    '*_territory_standing',
    '*_territorygovernance',
    '*_tradeskill*',
    '*_variations_*',
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
    'quests/**/*_npcs',
    'weaponabilities/*',
    //'quests/**/*_objectivetasks',
    'seasonsrewards/**/*_seasonpassdata_*',
    'seasonsrewards/**/*_rewarddata_*',
  ]),
  tableSource('seasonsrewards/**/*_rewarddata_*', [
    mapPropToArray({
      keys: ['EntitlementIds'],
      separator: ',',
    }),
  ]),
  tableSource('javelindata_gamemodes', [
    mapPropToArray({
      keys: ['PossibleItemDropIds', 'PossibleItemDropIdsByLevel01', 'LootTags', 'MutLootTagsOverride'],
      separator: ',',
    }),
  ]),
  tableSource('javelindata_backstorydata', [
    mapPropToArray({
      keys: [
        'ObjectiveUnlockOverride',
        'AchievementUnlockOverride',
        'WeaponMasteries',
        'CategoricalProgression',
        'RespawnPointTerritories',
        'InventoryItem',
      ],
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
  tableSource(
    ['javelindata_lootbuckets', 'javelindata_lootbuckets_pvp'],
    [
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
    ],
  ),
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
  tableSource(
    // prettier-ignore
    [
      'pvp_rewardstrack/javelindata_pvp_store_v2'
    ],
    [
      mapPropToArray({
        keys: [/Tag\d/],
        separator: ',',
      }),
    ],
  ),
  tableSource(
    // prettier-ignore
    [
      '**/*_damagetable_*',
      '**/*_damagetable',
    ],
    [
      mapPropToArray({
        keys: ['StatusEffect'],
        separator: ',',
      }),
    ],
  ),
  tableSource(
    // prettier-ignore
    [
      'javelindata_entitlements',
    ],
    [
      mapPropToArray({
        keys: ['Reward(s)'],
        separator: '+',
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
        'AfterSequence',
        'AttachedTargetSpellIds',
        'AttackType',
        'DamageTableRow',
        'DamageTableRowOverride',
        'DamageTypes',
        'DontHaveStatusEffect',
        'EquipLoadCategory',
        'InSequence',
        'ManaCostList',
        'OnEquipStatusEffect',
        'OtherApplyStatusEffect',
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
      mapPropToArray({
        keys: ['SalvageLootTags'],
        separator: /[,+]/,
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
        separator: /[,+]/,
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
        map: (value) => STATUS_EFFECT_CAT_FIXES[value] || value,
      }),
      mapPropToArray({
        keys: ['RemoveStatusEffects', 'EffectDurationMods'],
        separator: /[,+]/,
      }),
    ],
  ),

  tableSource(
    [
      'arenas/*',
      'pointofinterestdefinitions/*',
      'javelindata_areadefinitions',
      'javelindata_darknessdefinitions',
      'javelindata_territorydefinitions',
    ],
    [
      mapPropToArray({
        keys: ['LootTags', 'VitalsCategory', 'POITag'],
        separator: ',',
      }),
    ],
  ),

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
  tableSource(['quests/**/*_npcs'], [deleteProp([/ConversationStateId/])]),
  tableSource(
    // prettier-ignore
    [
      '*_variations_*',
    ],
    [
      deleteProp([
        'AOIRadius',
        'AudioPreload_Depletion',
        'BaseSlice',
        'Collision_Play_SFX',
        'Collision_Stop_SFX',
        'CollisionFX',
        'DepletedMat',
        'DepletedMesh',
        'DepletedSFX',
        'DepletedVFX',
        'DetectableRadius',
        'EndMeshLOD',
        'GatheringRadius',
        'InteractionHeight',
        'InteractionRadius',
        'MarkerRadius',
        'NPC_IdleAnimTimeline',
        'NPC_RunawayTimeline',
        'NPC_Visuals',
        'StartMat',
        'StartMesh',
        'StartMeshLOD',
        'VegAreaClearRadius',
        'VegAreaDataSet',
        'VegAreaInnerRadius',
        'VegAreaOuterRadius',
        'AudioPreload_Burst_1',
        'AudioPreload_Burst_2',
        'AudioPreload_Burst_3',
        'AudioPreload_depleted',
        'AudioPreload_loop',
        'BottomMat',
        'BottomMesh',
        'DepletedVFX',
        'GatheringFX',
        'InteractionMarker_Offset_X',
        'InteractionMarker_Offset_Y',
        'InteractionMarker_Offset_Z',
        'SFX_Burst_1',
        'SFX_Burst_2',
        'SFX_Burst_3',
        'SFX_depleted',
        'SFX_Idle',
        'TopMat',
        'TopMesh_TransformZ',
        'TopMesh',
        'VFX_Idle',
        'Visuals_Healthy',
        'Visual_Healthy',
        'Visual_Depleted',
        'Visual_Frame',
        'VFX_Burst_1',
        'VFX_Burst_2',
        'VFX_Burst_3',
        'EnableBurstParticle1',
        'EnableBurstParticle2',
        'EnableBurstParticle3',
        'Depleted_SFX',
        'DetectableObjectRadius',
        'IdleVFX',
        'Visual_Loot',
        'InteractionX',
        'InteractionY',
        'InteractionZ',
        'DetectableX',
        'DetectableY',
        'DetectableZ',
        'MarkerX',
        'MarkerY',
        'MarkerZ',
      ]),
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
