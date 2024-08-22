import path from 'node:path'
import { DatasheetHeader } from '../../file-formats/datasheet/converter'
import { readJSONFile, useProgressBar, withProgressBar } from '../../utils'
import { generateInterfaces } from './generate-interfaces'
import { generateTableColumns } from './generate-table-columns'
import { generateTableIndex } from './generate-table-index'
import { generateTableTypes } from './generate-table-types'

export async function generateTableCode({
  tableFiles,
  getHeader,
  getRows,
}: {
  tableFiles: string[]
  getHeader: (file: string) => Promise<DatasheetHeader>
  getRows: (file: string) => Promise<any[]>
}) {
  const samples = new Map<string, any[]>()
  const apiFiles: Array<{
    file: string
    type: string
    sheetType: string
    sheetName: string
  }> = []

  await withProgressBar({ label: 'Parsing Tables', tasks: tableFiles }, async (file, i, log) => {
    const header = await getHeader(file)
    const rows = await getRows(file)
    const type = getTableTypeName(header, file)
    if (!rows.length) {
      return
    }

    if (!samples.has(type)) {
      samples.set(type, [])
    }
    samples.get(type).push(rows)

    apiFiles.push({
      file,
      type,
      sheetType: header.type,
      sheetName: header.name,
    })
  })

  return useProgressBar('Generating Code', async (bar) => {
    bar.setTotal(4)

    const tsColumns = generateTableColumns(samples)
    bar.increment()

    const tsTableTypes = generateTableTypes(samples, {
      enumProps: (type) => ENUMS[type],
    })
    bar.increment()

    const tsTableIndex = generateTableIndex(apiFiles)
    bar.increment()

    bar.increment()
    bar.stop()
    return [
      { name: 'types.ts', content: tsTableTypes },
      { name: 'datatables.ts', content: tsTableIndex },
      { name: 'cols.ts', content: tsColumns },
    ]
  })
}

export async function generateMetaTypes(files: string[]) {
  const samples = new Map<string, any[]>()
  for (const file of files) {
    const data = await readJSONFile<any[]>(file)
    const type = getFileType(file)
    if (!samples.has(type)) {
      samples.set(type, [])
    }
    samples.get(type).push(data)
  }
  return generateInterfaces(samples)
}

function getFileType(file: string) {
  file = path.basename(file, path.extname(file))
  return file
    .split('_')
    .map((it) => it.charAt(0).toUpperCase() + it.slice(1))
    .join('')
}
function getTableTypeName(header: DatasheetHeader, file: string) {
  switch (header.type) {
    case 'unknown':
    case 'CategoricalProgressionRankData': {
      return header.name
    }
    case 'VariationData': {
      if (header.name.startsWith('Gatherable_')) {
        return 'VariationDataGatherable'
      }
      if (header.name.startsWith('HouseItems')) {
        return 'HouseItems'
      }
      return header.type
    }
  }
  return header.type
}

const ENUMS = {
  AchievementData: {
    Category: 'AchievementCategory',
  },
  VitalsData: {
    Family: 'VitalsFamily',
    VitalsCategories: 'VitalsCategory',
    CreatureType: 'CreatureType',
    LootTags: 'LootTag',
  },
  EntitlementData: {
    RewardType: 'EntitlementRewardType',
    SourceType: 'EntitlementSourceType',
  },
  BuffBucketData: {
    TableType: 'BuffTableType',
    BuffType1: 'BuffType',
    BuffType2: 'BuffType',
    BuffType3: 'BuffType',
    BuffType4: 'BuffType',
    BuffType5: 'BuffType',
    BuffType6: 'BuffType',
  },
  ArmorAppearanceDefinitions: {
    ItemClass: 'ItemClass',
  },
  WeaponAppearanceDefinitions: {
    ItemClass: 'ItemClass',
  },

  MasterItemDefinitions: {
    ItemClass: 'ItemClass',
    ItemType: 'ItemType',
    TradingGroup: 'TradingGroup',
    TradingFamily: 'TradingFamily',
    TradingCategory: 'TradingCategory',
  },
  HouseItems: {
    Placement: 'ItemPlacement',
    ItemType: 'ItemType',
    HousingTags: 'HousingTag',
    TradingGroup: 'TradingGroup',
    TradingFamily: 'TradingFamily',
    TradingCategory: 'TradingCategory',
    'HousingTag1 Placed': 'HousingTag',
    'HousingTag2 Points': 'HousingTag',
    'HousingTag3 Limiter': 'HousingTag',
    'HousingTag5 Buffs': 'HousingTag',
  },

  DamageTypeData: {
    TypeID: 'DamageType',
    Category: 'DamageCategory',
  },
  DamageData: {
    DamageType: 'DamageType',
  },
  // Loottable: ['Conditions'],
  PerkData: {
    PerkType: 'PerkType',
    ItemClass: 'ItemClass',
    WeaponTag: 'WeaponTag',
    ConditionEvent: 'PerkConditionEvent',
    DayPhases: 'DayPhases',
  },
  AbilityData: {
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
  StatusEffectData: {
    EffectCategories: 'StatusEffectCategory',
    HitCondition: 'HitCondition',
    DamageType: 'DamageType',
  },
  AffixStatData: {
    DamageType: 'DamageType',
  },
}
