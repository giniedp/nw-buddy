import * as path from 'path'
import * as fs from 'fs'
import { generateDataFunctions, processArrayWithProgress, tsFromJson } from '../utils'
import { DatatableSource } from './loadDatatables'

export async function generateTypes(output: string, tables: DatatableSource[]) {

  const samples = new Map<string, any[]>()
  const files = new Map<string, any[]>()
  for (const { file, relative, data } of tables) {
    const type = pathToTypeName(file)
    if (!samples.has(type)) {
      samples.set(type, [])
      files.set(type, [])
    }
    samples.get(type).push(data)
    files.get(type).push(relative)
  }

  const typesCode: string[] = []

  await processArrayWithProgress(Array.from(samples.entries()), async ([type, candidates]) => {
    const enums = enumFieldsForType(type)
    const samples: string[] = candidates.flat(1).map((it) => {
      it = JSON.parse(JSON.stringify(it))
      Object.keys(it).forEach((key) => {
        if (enums.includes(key)) {
          return
        }
        // map non enum strings to emtpy strings, so that enums are not generated
        if (typeof it[key] === 'string') {
          it[key] = ''
        }
        // map arrays of strings to `['']` so that enums are not generated
        if (Array.isArray(it[key])) {
          it[key] = ['']
        }
      })
      return JSON.stringify(it)
    })
    const result = await tsFromJson(type, samples)
    const tsCode = result.lines.join('\n').trim()
    if (tsCode) {
      typesCode.push(tsCode)
    } else {
      files.delete(type)
    }
  })

  await fs.promises.writeFile(path.join(output, 'types.ts'), Buffer.from(typesCode.join('\n'), 'utf-8'))
  await fs.promises.writeFile(
    path.join(output, 'datatables.ts'),
    Buffer.from(generateDataFunctions(files), 'utf-8')
  )
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
  // Vitals: ['Family', 'CreatureType'],
  // ItemDefinitionMaster: ['ItemType']
}
function enumFieldsForType(type: string): string[] {
  return ENUMS[type] || []
}
