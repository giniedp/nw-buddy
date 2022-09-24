import * as path from 'path'
import { program } from 'commander'
import * as dotenv from 'dotenv'
import {
  processArrayWithProgress,
  writeJSONFile,
} from './utils'
import { loadDatatables, splitToArrayRule } from './importer/loadDatatables'
import { importLocales } from './importer/importLocales'
import { importImages } from './importer/importImages'
import { generateTypes } from './importer/generateTypes'
import { checkExpressions } from './importer/checkExpressions'
import { env } from './env'
dotenv.config()

program
  .option('-i, --input <path>', 'input directory')
  .option('-o, --output <path>', 'output directory')
  .option('--ptr', 'PTR mode', ['true', 'yes', '1'].includes(process.env['NW_PTR']))
  .action(async () => {
    const options = program.opts<{ input: string, output: string, ptr: boolean }>()
    const input = options.input || env(options.ptr).dataDir
    const output = options.output || './apps/web/nw-data'

    console.log('loading datatables')
    const tables = await loadDatatables({
      inputDir: input,
      patterns: [
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
        '*_itemdefinitions_resources',
        '*_itemdefinitions_master_*',
        '*_itemdefinitions_weapons',
        '*_itemdefinitions_consumables',
        '*_staminacosts_player',
        '*_manacosts_player',
        '*_lootbuckets',
        '*_lootlimits',
        '*_loottables*',
        '*_metaachievements',
        '*_milestonerewards',
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
      ].map((it) => it + '.json'),
      remap: [
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
          file: /javelindata_vitals\.json/,
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
          file: /_itemdefinitions_master_/,
          rules: [
            splitToArrayRule({
              properties: ['ItemClass'],
              separator: '+',
            }),
            splitToArrayRule({
              properties: ['IngredientCategories'],
              separator: ',',
            }),
          ],
        },
        {
          file: /javelindata_perks\.json/,
          rules: [
            splitToArrayRule({
              properties: ['ItemClass', 'ExclusiveLabels', 'ExcludeItemClass'],
              separator: '+',
            }),
          ],
        },
        {
          file: /javelindata_weaponabilities\.json/,
          rules: [
            splitToArrayRule({
              properties: ['AttackType'],
              separator: ',',
            }),
          ],
        },
        {
          file: /javelindata_statuseffects_.*\.json|javelindata_statuseffects\.json/,
          rules: [
            splitToArrayRule({
              properties: ['EffectCategories'],
              separator: '+',
            }),
          ],
        },
      ],
    })

    console.log('importing locales')
    await importLocales({
      input,
      output: path.join(output, 'localization'),
      tables,
      preserveKeys: [
        'ui_itemtypedescription_head_slot',
        'ui_itemtypedescription_chest_slot',
        'ui_itemtypedescription_hands_slot',
        'ui_itemtypedescription_legs_slot',
        'ui_itemtypedescription_feet_slot',
        'ui_weapon1',
        'ui_weapon2',
        'ui_ring_slot_tooltip',
        'ui_unlock_token_slot',
        'ui_amulet_slot_tooltip',
        'RarityLevel0_DisplayName',
        'RarityLevel1_DisplayName',
        'RarityLevel2_DisplayName',
        'RarityLevel3_DisplayName',
        'RarityLevel4_DisplayName',
        'ui_dungeon_mutator_bronze',
        'ui_dungeon_mutator_silver',
        'ui_dungeon_mutator_gold',
        'ui_strength',
        'ui_dexterity',
        'ui_intelligence',
        'ui_constitution',
        'ui_focus'
      ],
    }).then((files) => {
      checkExpressions({
        locales: files,
        output: './tmp/expressions.json'
      })
    })
    console.log('importing images')
    await importImages({
      input,
      output,
      tables,
      ignoreKeys: ['HiResIconPath'],
      rewrite: {
        ArmorAppearanceF: (key, value, obj) => `lyshineui/images/icons/items/${obj.ItemType}/${value}`,
        ArmorAppearanceM: (key, value, obj) => `lyshineui/images/icons/items/${obj.ItemType}/${value}`,
        WeaponAppearanceOverride: (key, value, obj) => `lyshineui/images/icons/items/${obj.ItemType}/${value}`
      },
      rewritePath: (value) => `${path.basename(output)}${value}`
    })
    console.log('writing datatables')
    await processArrayWithProgress(tables, async ({ relative, data }) => {
      await writeJSONFile(data, path.join(output, 'datatables', relative), {
        createDir: true,
      })
    })

    console.log('generate types')
    await generateTypes(output, tables)
  })
  .parse(process.argv)
