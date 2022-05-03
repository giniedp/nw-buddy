import * as path from 'path'
import * as fs from 'fs'
import { program } from 'commander'
import { glob } from './utils/glob'
import { tsFromJson } from './utils/ts-from-json'
import * as dotenv from 'dotenv'
import { copyFile, generateDataFunctions, mkdir, processArrayWithProgress, renameExtname, spawn, writeJSONFile } from './utils'
import { extractExpressions } from './utils/extractExpressions'
import { loadDatatables } from './importer/loadDatatables'
import { importLocales } from './importer/importLocales'
import { importImages } from './importer/importImages'
import { generateTypes } from './importer/generateTypes'
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
    output = output

    console.log('loading datatables')
    const tables = await loadDatatables(input, [
      '*_affixdefinitions',
      '*_affixstats',
      '*_afflictions',
      '*_areadefinitions',
      '*_categoricalprogression',
      '*_crafting',
      '*_craftingcategories',
      '*_damagetable_*',
      '*_damagetable',
      '*_damagetypes',
      '*_gameevents',
      '*_gamemodes',
      '*_gatherables',
      '*_housingitems',
      '*_itemdefinitions_master_*',
      '*_itemdefinitions_weapons',
      '*_itemdefinitions_consumables',
      '*_staminacosts_player',
      '*_manacosts_player',
      '*_lootbuckets',
      '*_lootlimits',
      '*_metaachievements',
      '*_perkbuckets',
      '*_perks',
      '*_spelltable_*',
      '*_spelltable',
      '*_statuseffectcategories',
      '*_statuseffects_*',
      '*_statuseffects',
      '*_territory_standing',
      '*_territorydefinitions',
      '*_territorygovernance',
      '*_tradeskill*',
      '*_umbralgsupgrades',
      '*_vitals',
      '*_vitalscategories',
      '*_vitalsleveldata',
      '*_vitalsmodifierdata',
      '*_weaponmastery',
      '*_xpamountsbylevel',
      'arenas/*',
      'gamemodemutators/*',
      'weaponabilities/*',
    ].map((it) => it + '.json'))

    console.log('importing locales')
    await importLocales(input, path.join(output, 'localization') , tables)
    console.log('importing images')
    await importImages(input, output, tables, {
      ignoreKeys: [
        'PlaceholderIcon',
        'HiResIconPath'
      ]
    })
    console.log('writing datatables')
    processArrayWithProgress(tables, async ({ relative, data }) => {
      await writeJSONFile(data, path.join(output, 'datatables', relative), {
        createDir: true
      })
    })

    console.log('generate types')
    await generateTypes(output, tables)
  })
  .parse(process.argv)
