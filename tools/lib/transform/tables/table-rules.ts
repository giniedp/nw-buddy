import fs from 'node:fs'
import path from 'node:path'
import { DatasheetFile } from '../../file-formats/datasheet/converter'
import { replaceExtname } from '../../utils/file-utils'
import { deleteProp, mapProp, mapPropToArray, transformRule } from './dsl'
import { MasterItemFile } from './table-schemas'

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
export const TRANSFORM_RULES = [
  transformRule(
    {
      type: '',
      name: '',
    },
    (rows) => {
      for (const row of rows) {
        for (const key in row) {
          const value = row[key]
          if (!value || typeof value !== 'string') {
            continue
          }
          if (!value.match(/^lyshineui/gi)) {
            continue
          }
          const image = path
            .normalize(value.toLowerCase())
            // removes space before extension
            //   - "lyshineui/images/icons/items/weapon/1hthrowingaxelostt2 .png"
            .replace(/\s+\.png$/, '.png')

          row[key] = replaceExtname(image, '.webp').replace(/\\/g, '/')
        }
      }
    },
  ),
  transformRule(
    {
      //name: 'seasonsrewards/**/*_rewarddata_*',
      type: 'SeasonsRewardData',
      name: /^SeasonsRewardData_.*/,
    },
    [
      mapPropToArray({
        keys: ['EntitlementIds'],
        separator: ',',
      }),
    ],
  ),
  transformRule(
    {
      type: 'GameModeData',
    },
    [
      mapPropToArray({
        keys: ['PossibleItemDropIds', 'PossibleItemDropIdsByLevel01', 'LootTags', 'MutLootTagsOverride'],
        separator: ',',
      }),
    ],
  ),
  transformRule(
    {
      type: 'BackstoryDefinition',
    },
    [
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
    ],
  ),
  transformRule(
    {
      type: 'VitalsData',
    },
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
  transformRule(
    {
      type: 'TerritoryDefinition',
    },
    [
      mapPropToArray({
        keys: ['LootTags'],
        separator: ',',
      }),
    ],
  ),
  transformRule(
    {
      name: 'MutationDifficulty',
      type: 'MutationDifficultyStaticData',
    },
    [
      mapPropToArray({
        keys: ['InjectedLootTags'],
        separator: ',',
      }),
    ],
  ),
  transformRule(
    {
      type: 'LootBucketData',
    },
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
  transformRule(
    {
      type: 'LootTablesData',
    },
    [
      mapPropToArray({
        keys: ['Conditions'],
        separator: ',',
      }),
    ],
  ),
  transformRule(
    {
      type: 'PvPStoreData',
    },
    [
      mapPropToArray({
        keys: [/Tag\d/],
        separator: ',',
      }),
    ],
  ),
  transformRule(
    {
      type: 'DamageData',
    },
    [
      mapPropToArray({
        keys: ['StatusEffect'],
        separator: ',',
      }),
    ],
  ),
  transformRule(
    {
      type: 'EntitlementData',
    },
    [
      mapPropToArray({
        keys: ['Reward(s)'],
        separator: '+',
      }),
    ],
  ),
  transformRule(
    {
      type: 'ConsumableItemDefinitions',
    },
    [
      mapPropToArray({
        keys: ['AddStatusEffects', 'RemoveStatusEffectCategories', 'RemoveStatusEffects'],
        separator: '+',
      }),
    ],
  ),
  transformRule(
    {
      type: 'ArmorAppearanceDefinitions',
    },
    [
      mapPropToArray({
        keys: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
    ],
  ),

  transformRule(
    {
      type: 'WeaponAppearanceDefinitions',
    },
    [
      mapPropToArray({
        keys: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
    ],
  ),

  transformRule(
    {
      type: 'AbilityData',
    },
    [
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
    ],
  ),

  transformRule(
    {
      type: 'MasterItemDefinitions',
    },
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

  transformRule(
    {
      type: 'VariationData',
      name: /^HouseItems/, // includes mtx
    },
    [
      mapPropToArray({
        keys: ['HousingTags', 'HousingTag1 Placed', 'HousingTag2 Points', 'HousingTag3 Limiter', 'HousingTag5 Buffs'],
        separator: /[,+]/,
      }),
    ],
  ),
  transformRule(
    {
      type: 'PerkData',
    },
    [
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
    ],
  ),

  transformRule(
    {
      type: 'StatusEffectCategoryData',
    },
    [
      mapProp(['ValueLimits'], (value: string) => {
        return Object.fromEntries(
          value.split(',').map((it) => {
            const [key, value] = it.split(':')
            return [key, Number(value)]
          }),
        )
      }),
    ],
  ),

  transformRule(
    {
      type: 'StatusEffectData',
    },
    [
      mapPropToArray({
        keys: ['EffectCategories', 'RemoveStatusEffectCategories'],
        separator: '+',
        map: (value) => STATUS_EFFECT_CAT_FIXES[value] || value,
      }),
      mapPropToArray({
        keys: ['RemoveStatusEffects', 'EffectDurationMods', 'RemoveStatusEffectCategories', 'PauseInGameModesList'],
        separator: /[,+]/,
      }),
    ],
  ),

  transformRule(
    {
      type: 'TerritoryDefinition',
    },
    [
      mapPropToArray({
        keys: ['LootTags', 'VitalsCategory', 'POITag'],
        separator: ',',
      }),
    ],
  ),

  transformRule(
    {
      type: 'AttributeDefinition',
    },
    [
      mapPropToArray({
        keys: ['EquipAbilities'],
        separator: ',',
      }),
    ],
  ),
  transformRule(
    {
      type: 'NPCData',
    },
    [deleteProp([/ConversationStateId/])],
  ),
  transformRule(
    {
      type: 'VariationData',
    },
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
  transformRule(
    {
      type: 'VitalsCategoryData',
    },
    [deleteProp('LocStringGenerationHelper')],
  ),

  transformRule(
    {
      type: 'MasterItemDefinitions',
    },
    (table, { tables, inputDir }) => {
      for (const row of table as MasterItemFile['rows']) {
        for (const iconKey of ['IconPath', 'HiResIconPath']) {
          const candidates = [
            getAppearanceIcon(row.ArmorAppearanceM as string, tables, iconKey),
            getAppearanceIcon(row.ArmorAppearanceF as string, tables, iconKey),
            row[iconKey],
            getAppearanceIcon(row.WeaponAppearanceOverride as string, tables, iconKey),
          ].filter((it) => !!it)

          const icon = candidates.find((icon) => {
            return !!icon && fs.existsSync(path.join(inputDir, replaceExtname(icon, '.png')))
          })
          if (icon) {
            row[iconKey] = replaceExtname(icon, '.webp').toLowerCase().replace(/\\/g, '/')
          } else {
            row[iconKey] = null
          }
        }
      }
    },
  ),
]

function getAppearanceIcon(appearanceId: string, tables: Record<string, DatasheetFile<any>>, iconKey: string) {
  if (!appearanceId) {
    return null
  }
  appearanceId = appearanceId.toLowerCase()
  for (const key in tables) {
    const it = tables[key]
    if (it.header.type === 'ArmorAppearanceDefinitions') {
      const icon = it.rows.find((it) => appearanceId === it.ItemID.toLowerCase())?.[iconKey]
      if (icon) {
        return icon
      }
    }
    if (it.header.type === 'WeaponAppearanceDefinitions') {
      const icon = it.rows.find((it) => appearanceId === it.WeaponAppearanceID.toLowerCase())?.[iconKey]
      if (icon) {
        return icon
      }
    }
  }
  return null
}
