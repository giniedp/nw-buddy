import * as path from 'path'
import * as fs from 'fs'
import { program } from 'commander'
import { glob } from './utils/glob'
import { tsFromJson } from './utils/ts-from-json'
import * as dotenv from 'dotenv'
import { copyFile, generateDataFunctions, mkdir, processArrayWithProgress, renameExtname, spawn } from './utils'
dotenv.config()

program
  .argument('<input>', 'input dir')
  .argument('<output>', 'output dir')
  .action(async (input: string, output: string) => {
    if (process.env[input]) {
      input = process.env[input]
    } else {
      input = path.join(process.cwd(), input)
    }
    output = path.join(process.cwd(), output)
    await importLocale(input, output)
    await importDatatables(input, output)
    await importIcons(input, output)
    await generateTypes(input, output)
  })
  .parse(process.argv)

async function importLocale(input: string, output: string) {
  console.log('import locales')
  const pattern = path.join(input, '**', 'localization', '**', '*.loc.json')
  const files = await glob(pattern)
  await processArrayWithProgress(files, async (file) => {
    const basename = path.basename(file)
    const pass =
      basename.startsWith('javelindata_') ||
      basename.startsWith('objectives') ||
      basename.startsWith('weaponabilities') ||
      basename.startsWith('globalcommontext') ||
      basename.startsWith('frontendcommontext') ||
      basename.startsWith('territorystanding')
    if (pass) {
      const outFile = path.join(output, path.relative(input, file))
      const outDir = path.dirname(outFile)
      await mkdir(outDir, { recursive: true })
      await copyFile(file, outFile)
    }
  })
}

async function importDatatables(input: string, output: string) {
  console.log('import datatables')
  input = path.join(input, 'sharedassets', 'springboardentitites')
  const pattern = path.join(input, 'datatables', '**', '*.json')
  const files = await glob(pattern)
  await processArrayWithProgress(files, async (file) => {
    const outFile = path.join(output, path.relative(input, file))
    const outDir = path.dirname(outFile)
    await mkdir(outDir, { recursive: true })
    await copyFile(file, outFile)
  })
}

async function importIcons(input: string, output: string) {
  console.log('import icons')
  input = path.join(input, 'lyshineui', 'images')
  const files = await glob([
    path.join(input, 'icons', 'abilities', '**', '*.png'),
    path.join(input, 'icons', 'achievements', '**', 'skilllevel_*.png'),
    path.join(input, 'icons', 'achievements', '**', 'refining_*.png'),
    path.join(input, 'icons', 'achievements', '**', 'weaponmastery_*.png'),
    path.join(input, 'icons', 'housing', '**', '*.png'),
    path.join(input, 'icons', 'items', '**', '*.png'),
    path.join(input, 'icons', 'perks', '**', '*.png'),
    path.join(input, 'icons', 'tradeskills', '**', '*.png'),
    path.join(input, 'icons', 'misc', '**', '*.png'),
    path.join(input, 'missionimages', '**', '*.png'),
    path.join(input, 'status', '**', '*.png'),
    path.join(input, 'map', 'icon', '**', '*.png'),
    path.join(input, 'dungeons', '**', '*.png'),
    path.join(input, 'crafting', '*.png'),
  ])

  await processArrayWithProgress(files, async (file) => {
    const outFile = renameExtname(path.join(output, path.relative(input, file)), '.webp')
    if (fs.existsSync(outFile)) {
      return
    }
    const outDir = path.dirname(outFile)
    await mkdir(outDir, { recursive: true })
    await spawn(`magick convert "${file}" -quality 65 "${outFile}"`, {
      shell: true,
      stdio: 'pipe',
      env: process.env,
      cwd: process.cwd(),
    }).catch(console.error)
  })
}

async function generateTypes(input: string, output: string) {
  console.log('generate types')
  const pattern = path.join(output, 'datatables', '**', '*.json')
  const files = await glob(pattern)
  const map = new Map<string, string[]>()
  for (const file of files) {
    const type = pathToTypeName(file)
    if (!map.has(type)) {
      map.set(type, [])
    }
    map.get(type).push(file)
  }

  const typesCode: string[] = []

  await processArrayWithProgress(Array.from(map.keys()), async (type) => {
    const samples: string[] = []
    await Promise.all(
      map.get(type).map(async (it) => {
        const buf = await fs.promises.readFile(it)
        const json = JSON.parse(buf.toString())
        const jsonSamples = Array.isArray(json) ? json : [json]
        samples.push(...jsonSamples.map((sample) => JSON.stringify(sample)))
      })
    )

    const result = await tsFromJson(type, samples)
    const tsCode = result.lines.join('\n').trim()
    if (tsCode) {
      typesCode.push(tsCode)
    } else {
      map.delete(type)
    }
  })

  const localeFiles = await glob(path.join(output, 'localization', '**', '*.json'))
  const localeSources = Array.from(new Set(localeFiles.map((it) => path.basename(it))).values())

  await fs.promises.writeFile(path.join(output, 'types.ts'), Buffer.from(typesCode.join('\n'), 'utf-8'))
  await fs.promises.writeFile(
    path.join(output, 'datatables.ts'),
    Buffer.from(generateDataFunctions(map, output, localeSources), 'utf-8')
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
