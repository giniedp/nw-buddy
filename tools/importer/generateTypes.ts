import * as path from 'path'
import * as fs from 'fs'
import { generateDataFunctions, processArrayWithProgress, tsFromJson } from '../utils'
import { DatatableSource } from './loadDatatables'

export async function generateTypes(output: string, tables: DatatableSource[]) {

  const mapSamples = new Map<string, any[]>()
  const mapFiles = new Map<string, any[]>()
  for (const { file, relative, data } of tables) {
    const type = pathToTypeName(file)
    if (!mapSamples.has(type)) {
      mapSamples.set(type, [])
      mapFiles.set(type, [])
    }
    mapSamples.get(type).push(data)
    mapFiles.get(type).push(relative)
  }

  const typesCode: string[] = []

  await processArrayWithProgress(Array.from(mapSamples.entries()), async ([type, candidates]) => {
    const samples: string[] = candidates.flat(1).map((it) => JSON.stringify(it))
    const result = await tsFromJson(type, samples)
    const tsCode = result.lines.join('\n').trim()
    if (tsCode) {
      typesCode.push(tsCode)
    } else {
      mapFiles.delete(type)
    }
  })

  await fs.promises.writeFile(path.join(output, 'types.ts'), Buffer.from(typesCode.join('\n'), 'utf-8'))
  await fs.promises.writeFile(
    path.join(output, 'datatables.ts'),
    Buffer.from(generateDataFunctions(mapFiles), 'utf-8')
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
