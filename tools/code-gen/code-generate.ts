import * as path from 'path'
import * as fs from 'fs'

import { DataTableSource } from '../importer/tables'
import { generateInterfaces } from './generate-interfaces'
import { generateApiService } from './generate-api-service'
import { generateTableColumns } from './generate-table-columns'

export async function generateTypes(output: string, tables: DataTableSource[], format: 'json' | 'csv' = 'json') {
  const samples = new Map<string, any[]>()
  const files = new Map<string, any[]>()
  for (const { file, relative, data } of tables) {
    const type = pathToTypeName(file)
    if (!samples.has(type)) {
      samples.set(type, [])
      files.set(type, [])
    }
    samples.get(type).push(data)
    files.get(type).push(relative.replace(/\.json$/, `.${format}`))
  }

  const tsColsInfos = generateTableColumns(samples)
  const tsInterfaces = await generateInterfaces(samples, {
    onEmptyType: (type) => files.delete(type),
    enumProps: (type) => ENUMS[type] || []
  })
  const tsApiServce = generateApiService(files)

  await fs.promises.writeFile(path.join(output, 'types.ts'), Buffer.from(tsInterfaces, 'utf-8'))
  await fs.promises.writeFile(path.join(output, 'datatables.ts'), Buffer.from(tsApiServce, 'utf-8'))
  await fs.promises.writeFile(path.join(output, 'cols.ts'), Buffer.from(tsColsInfos, 'utf-8'))
}

const PATH_TO_TYPE_RULES = [
  {
    test: /_conversationstate[._]/,
    name: 'ConversationState',
  },
  {
    test: /_conversationtopics[._]/,
    name: 'ConversationTopic',
  },
  {
    test: /_damagetable[._]/,
    name: 'Damagetable',
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
    test: /_controbution[._]/,
    name: 'Contribution',
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

  const exclude = ['javelindata']
  const baseName = path.basename(filePath)

  return baseName
    .split('.')[0]
    .split('_')
    .filter((it) => {
      if (exclude.includes(it) || it.match(/\d+/)) {
        return false
      }
      return true
    })
    .map((it) => {
      if (it === 'ai') {
        return 'AI'
      }
      return it[0].toUpperCase() + it.substring(1)
    })
    .join('')
}

const ENUMS = {
  Vitals: ['Family'],
  Vitalsmetadata: ['spawns'],
  // ItemDefinitionMaster: ['ItemClass'],
  // Damagetypes: ['TypeID', 'Category'],
  // Loottable: ['Conditions'],
  Perks: [
    'PerkType',
    'ItemClass',
    'WeaponTag',
    'ConditionEvent',
    'DayPhases'
  ],
  Ability: [
    'AbilityCooldownComparisonType',
    'DistComparisonType',
    'LoadedAmmoCountComparisonType',
    'MyComparisonType',
    'MyManaComparisonType',
    'MyStaminaComparisonType',
    'NumAroundComparisonType',
    'NumberOfHitsComparisonType',
    'TargetComparisonType',
    'WeaponTag',
    'UICategory',
    'AttackerVitalsCategory',
    'TargetVitalsCategory',
    'AbilityOnCooldownOptions',
    'AttackType',
    'CDRImmediatelyOptions',
    'EquipLoadCategory',
    'GatheringTradeskill'
  ],
}
