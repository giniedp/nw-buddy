import * as path from 'path'
import * as fs from 'fs'

import { generateApiService } from './generate-api-service'
import { generateTableColumns } from './generate-table-columns'
import { generateTableTypes } from './generate-table-types'
import { generateInterfaces } from './generate-interfaces'

export async function generateTypes(output: string, tables: Array<{ file: string, data: Array<any> }>, format: 'json' | 'csv' = 'json') {
  const javelinSamples = new Map<string, any[]>()
  const otherSamples = new Map<string, any[]>()
  const files = new Map<string, any[]>()
  for (const { file, data } of tables) {
    const type = pathToTypeName(file)
    const isJavelin = file.includes('javelindata_')
    if (isJavelin) {
      if (!javelinSamples.has(type)) {
        javelinSamples.set(type, [])
        files.set(type, [])
      }
      javelinSamples.get(type).push(data)
    } else {
      if (!otherSamples.has(type)) {
        otherSamples.set(type, [])
        files.set(type, [])
      }
      otherSamples.get(type).push(data)
    }
    files.get(type).push(file.replace(/\.json$/, `.${format}`))
  }

  const javelinCols = generateTableColumns(javelinSamples)
  const javelinTypes = generateTableTypes(javelinSamples, {
    onEmptyType: (type) => files.delete(type),
    enumProps: (type) => ENUMS[type],
  })
  const otherTypes = await generateInterfaces(otherSamples)
  const tsApiServce = generateApiService(files)
  const tsTypes = [javelinTypes, otherTypes].join('\n\n')
  await fs.promises.writeFile(path.join(output, 'types.ts'), Buffer.from(tsTypes, 'utf-8'))
  await fs.promises.writeFile(path.join(output, 'datatables.ts'), Buffer.from(tsApiServce, 'utf-8'))
  await fs.promises.writeFile(path.join(output, 'cols.ts'), Buffer.from(javelinCols, 'utf-8'))
}

const PATH_TO_TYPE_RULES = [
  {
    test: /_variations_gatherables_/,
    name: 'VariationsGatherables',
  },
  {
    test: /_conversationstate[._]/,
    name: 'ConversationState',
  },
  {
    test: /_conversationtopics[._]/,
    name: 'ConversationTopic',
  },
  {
    test: /javelindata_crafting[._]/,
    name: 'Crafting',
  },
  {
    test: /_damagetable[._]/,
    name: 'Damagetable',
  },
  {
    test: /_seasonpassdata_/,
    name: 'SeasonPassData',
  },
  {
    test: /_gameevents[._]/,
    name: 'GameEvent',
  },
  {
    test: /_itemdefinitions_master[._]/,
    name: 'ItemDefinitionMaster',
  },
  {
    test: /_itemdefinitions_mtx/,
    name: 'ItemDefinitionMtx',
  },
  {
    test: /(_housingitems)|(_housingitems_mtx)/,
    name: 'Housingitems',
  },
  {
    test: /_npcs[._]/,
    name: 'Npc',
  },
  {
    test: /_objectives[._]/,
    name: 'Objective',
  },
  {
    test: /_spelltable[._]/,
    name: 'Spelltable',
  },
  {
    test: /_statuseffects[._]/,
    name: 'Statuseffect',
  },
  {
    test: /_poidefinitions[._]/,
    name: 'PoiDefinition',
  },
  {
    test: /_ability[._]/,
    name: 'Ability',
  },
  {
    test: /_contribution[._]/,
    name: 'Contribution',
  },
  {
    test: /_loottables[._]/,
    name: 'Loottable',
  },
]

function pathToTypeName(filePath: string) {
  const found = PATH_TO_TYPE_RULES.find((it) => it.test.test(filePath))
  if (found) {
    return found.name
  }

  const exclude = ['javelindata', 'generated']
  return path
    .basename(filePath)
    .split('.')[0]
    .split('_')
    .filter((it) => !exclude.includes(it) && !it.match(/\d+/))
    .map((it) => it[0].toUpperCase() + it.substring(1))
    .join('')
}

const ENUMS = {
  Vitals: {
    Family: 'VitalsFamily',
    VitalsCategories: 'VitalsCategory',
    CreatureType: 'CreatureType',
    LootTags: 'LootTag',
  },
  Entitlements: {
    RewardType: 'EntitlementRewardType',
    SourceType: 'EntitlementSourceType',
  },
  Buffbuckets: {
    TableType: 'BuffTableType',
    BuffType1: 'BuffType',
    BuffType2: 'BuffType',
    BuffType3: 'BuffType',
    BuffType4: 'BuffType',
    BuffType5: 'BuffType',
    BuffType6: 'BuffType',
  },
  Itemappearancedefinitions: {
    ItemClass: 'ItemClass',
  },
  ItemdefinitionsInstrumentsappearances: {
    ItemClass: 'ItemClass',
  },
  ItemdefinitionsWeaponappearances: {
    ItemClass: 'ItemClass',
  },
  ItemdefinitionsWeaponappearancesMountattachments: {
    ItemClass: 'ItemClass',
  },
  ItemDefinitionMaster: {
    ItemClass: 'ItemClass',
    ItemType: 'ItemType',
    TradingGroup: 'TradingGroup',
    TradingFamily: 'TradingFamily',
    TradingCategory: 'TradingCategory',
  },
  Housingitems: {
    Placement: 'ItemPlacement',
    ItemType: 'ItemType',
    HousingTags: 'HousingTag',
    TradingGroup: 'TradingGroup',
    TradingFamily: 'TradingFamily',
    TradingCategory: 'TradingCategory',
  },
  Damagetypes: {
    TypeID: 'DamageType',
    Category: 'DamageCategory',
  },
  Damagetable: {
    DamageType: 'DamageType',
  },
  // Loottable: ['Conditions'],
  Perks: {
    PerkType: 'PerkType',
    ItemClass: 'ItemClass',
    WeaponTag: 'WeaponTag',
    ConditionEvent: 'PerkConditionEvent',
    DayPhases: 'DayPhases',
  },
  Ability: {
    AbilityCooldownComparisonType: 'ComparisonType',
    DistComparisonType: 'ComparisonType',
    LoadedAmmoCountComparisonType: 'ComparisonType',
    MyComparisonType: 'ComparisonType',
    MyManaComparisonType: 'ComparisonType',
    MyStaminaComparisonType: 'ComparisonType',
    NumAroundComparisonType: 'ComparisonType',
    NumberOfHitsComparisonType: 'ComparisonType',
    TargetComparisonType: 'ComparisonType',
    WeaponTag: 'WeaponTag',
    UICategory: 'UICategory',
    AttackerVitalsCategory: 'VitalsCategory',
    TargetVitalsCategory: 'VitalsCategory',
    AbilityOnCooldownOptions: 'AbilityOnCooldownOptions',
    AttackType: 'AttackType',
    CDRImmediatelyOptions: 'CDRImmediatelyOptions',
    EquipLoadCategory: 'EquipLoadCategory',
    GatheringTradeskill: 'GatheringTradeskill',
    StatusEffectCategories: 'StatusEffectCategory',
    StatusEffectCategoriesList: 'StatusEffectCategory',
    StatusEffectDurationCats: 'StatusEffectCategory',
    TargetStatusEffectCategory: 'StatusEffectCategory',
    TargetStatusEffectDurationCats: 'StatusEffectCategory',
    DamageTypes: 'DamageType',
    DamageCategory: 'DamageCategory',
  },
  Statuseffect: {
    EffectCategories: 'StatusEffectCategory',
    HitCondition: 'HitCondition',
    DamageType: 'DamageType',
  },
  Affixstats: {
    DamageType: 'DamageType',
  },
}
