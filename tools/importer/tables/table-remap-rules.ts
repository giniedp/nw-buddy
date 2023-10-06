import { splitToArrayRule } from './import-datatables'

const ITEM_CLASS_FIXES = {
  '2hAxe': '2HAxe',
  Greatsword: 'GreatSword',
  Heartgem: 'HeartGem',
  Pickaxe: 'PickAxe',
  spear: 'Spear',
  named: 'Named',
  roundShied: 'RoundShield',
}

export const TABLE_REMAP_RULES = [
  {
    file: /javelindata_gamemodes\.json/,
    rules: [
      splitToArrayRule({
        properties: ['PossibleItemDropIds', 'LootTags', 'MutLootTagsOverride'],
        separator: ',',
      }),
    ],
  },
  {
    file: /javelindata_vitals.*\.json/,
    rules: [
      splitToArrayRule({
        properties: ['VitalsCategories', 'LootTags'],
        separator: ',',
      }),
    ],
  },
  {
    file: /javelindata_territorydefinitions\.json/,
    rules: [
      splitToArrayRule({
        properties: ['LootTags'],
        separator: ',',
      }),
    ],
  },
  {
    file: /javelindata_mutationdifficulty\.json/,
    rules: [
      splitToArrayRule({
        properties: ['InjectedLootTags'],
        separator: ',',
      }),
    ],
  },
  {
    file: /javelindata_lootbuckets\.json/,
    rules: [
      splitToArrayRule({
        properties: /Tags\d+/,
        separator: ',',
      }),
    ],
  },
  {
    file: /javelindata_loottables.*.json/,
    rules: [
      splitToArrayRule({
        properties: ['Conditions'],
        separator: ',',
      }),
    ],
  },
  {
    file: /_itemdefinitions_consumables.json/,
    rules: [
      splitToArrayRule({
        properties: ['AddStatusEffects', 'RemoveStatusEffectCategories', 'RemoveStatusEffects'],
        separator: '+',
      }),
    ],
  },
  {
    file: /_itemappearancedefinitions.json/,
    rules: [
      splitToArrayRule({
        properties: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
    ],
  },
  {
    file: /_itemdefinitions_weaponappearances(_mountattachments)?.json/,
    rules: [
      splitToArrayRule({
        properties: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
      {
        match: ['NumberOfHitsComparisonType'],
        remap: (value: string) => {
          if (value === 'LessthanOrEqual&#160;') {
            return 'LessThanOrEqual'
          }
          return value
        },
      },
    ],
  },
  {
    file: /_ability_/,
    rules: [
      {
        match: ['NumberOfHitsComparisonType'],
        remap: (value: string) => {
          if (value === 'LessthanOrEqual&#160;') {
            return 'LessThanOrEqual'
          }
          return value
        },
      },
    ],
  },

  {
    file: /_itemdefinitions_instrumentsappearances.json/,
    rules: [
      splitToArrayRule({
        properties: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
    ],
  },
  {
    file: /_itemdefinitions_(master_|mtx_)/,
    rules: [
      splitToArrayRule({
        properties: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
      splitToArrayRule({
        properties: ['IngredientCategories'],
        separator: ',',
      }),
    ],
  },
  {
    file: /_housingitems/,
    rules: [
      splitToArrayRule({
        properties: ['HousingTags'],
        separator: '+',
      }),
    ],
  },
  {
    file: /javelindata_perks\.json/,
    rules: [
      splitToArrayRule({
        properties: ['ItemClass'],
        separator: '+',
        map: (value) => ITEM_CLASS_FIXES[value] || value,
      }),
      splitToArrayRule({
        properties: ['ExclusiveLabels', 'ExcludeItemClass'],
        separator: '+',
      }),
      splitToArrayRule({
        properties: ['EquipAbility'],
        separator: ',',
      }),
    ],
  },
  {
    file: /javelindata_ability_\w+\.json/,
    rules: [
      splitToArrayRule({
        properties: [
          'AbilityList',
          'AttachedTargetSpellIds',
          'AttackType',
          'DamageTypes',
          'DamageTableRow',
          'DamageTableRowOverride',
          'ManaCostList',
          'RemoteDamageTableRow',
          'RemoveTargetStatusEffectsList',
          'SelfApplyStatusEffect',
          'StaminaCostList',
          'StatusEffectCategories',
          'StatusEffectCategoriesList',
          'StatusEffectsList',
          'TargetStatusEffectCategory',
          'TargetStatusEffectDurationList',
        ],
        separator: ',',
      }),
      {
        match: ['Icon'],
        remap: (value: string) => (value === 'bowAbility5_mod2' ? null : value),
      },
    ],
  },
  {
    file: /javelindata_statuseffectcategories\.json/,
    rules: [
      {
        match: 'ValueLimits',
        remap: (value: string) =>
          Object.fromEntries(
            value.split(',').map((it) => {
              const [key, value] = it.split(':')
              return [key, Number(value)]
            })
          ),
      },
    ],
  },
  {
    file: /javelindata_statuseffects_.*\.json|javelindata_statuseffects\.json/,
    rules: [
      splitToArrayRule({
        properties: ['EffectCategories', 'RemoveStatusEffectCategories'],
        separator: '+',
      }),
      splitToArrayRule({
        properties: ['RemoveStatusEffects'],
        separator: /[,+]/,
      }),
    ],
  },
  {
    file: /pointofinterestdefinitions/,
    rules: [
      splitToArrayRule({
        properties: ['LootTags', 'VitalsCategory'],
        separator: ',',
      }),
    ],
  },
  {
    file: /javelindata_attribute.*.json/,
    rules: [
      splitToArrayRule({
        properties: ['EquipAbilities'],
        separator: ',',
      }),
    ],
  },
]
