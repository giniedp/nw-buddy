import * as path from 'path'
import { program } from 'commander'
import { processArrayWithProgress, writeJSONFile } from './utils'
import { loadDatatables, splitToArrayRule } from './importer/loadDatatables'
import { importLocales } from './importer/importLocales'
import { importImages } from './importer/importImages'
import { generateTypes } from './importer/generateTypes'
import { checkExpressions } from './importer/checkExpressions'
import { NW_USE_PTR, web, nwData } from '../env'

program
  .option('-i, --input <path>', 'input directory')
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .action(async () => {
    const options = program.opts<{ input: string; output: string; ptr: boolean }>()
    const inputDir = options.input || nwData.tmpDir(options.ptr)!
    const distDir = nwData.distDir(options.ptr)!
    const publicDir = nwData.assetPath(options.ptr)
    const typesDir = web.src('nw-data')

    console.log('[IMPORT]', inputDir)
    console.log('     to:', distDir)
    console.log(' images:', publicDir)
    console.log('  types:', typesDir)

    console.log('loading datatables')
    const tables = await loadDatatables({
      inputDir: inputDir,
      patterns: [
        '*_affixdefinitions',
        '*_affixstats',
        '*_afflictions',
        '*_areadefinitions',
        '*_attributeconstitution',
        '*_attributedexterity',
        '*_attributefocus',
        '*_attributeintelligence',
        '*_attributestrength',
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
        '*_housetypes',
        '*_itemdefinitions_consumables',
        '*_itemdefinitions_master_*',
        '*_itemdefinitions_resources',
        '*_itemdefinitions_weapons',
        '*_itemdefinitions_armor',
        '*_itemdefinitions_runes',
        '*_lootbuckets',
        '*_lootlimits',
        '*_loottables*',
        '*_manacosts_player',
        '*_metaachievements',
        '*_milestonerewards',
        '*_perkbuckets',
        '*_perks',
        '*_spelltable_*',
        '*_spelltable',
        '*_staminacosts_player',
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
        'pointofinterestdefinitions/*',
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
            splitToArrayRule({
              properties: ['EquipAbility'],
              separator: ',',
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
        {
          file: /pointofinterestdefinitions/,
          rules: [
            splitToArrayRule({
              properties: ['LootTags', 'VitalsCategory'],
              separator: ',',
            }),
          ],
        },
      ],
    })

    console.log('importing locales')
    await importLocales({
      input: inputDir,
      output: path.join(distDir, 'localization'),
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

        'ui_physical',
        'ui_elemental',
        'ui_physical_defense_short',
        'ui_physical_defense_full',
        'ui_elemental_defense_short',
        'ui_elemental_defense_full',
        'inv_equipLoadFast',
        'inv_equipLoadNormal',
        'inv_equipLoadSlow',
        'ui_strength',
        'ui_dexterity',
        'ui_intelligence',
        'ui_constitution',
        'ui_focus',
        'ui_resistance',
        'ui_bindOnEquip',
        'ui_bindOnPickup',
        'ui_durability',
        'ui_level_requirement',
        /^[a-zA-Z]+_DamageName/,
        /^ui_poi_.*_description/,
        /^ui_tooltip_.*/,
        /^ui_ability_.*/,
        'ui_tooltip_basedamage',
        /^ui_(hatchet|rapier|straightsword|warhammer|greataxe|musket|bowspear|).*/,
        /^ui_(firestaff|lifestaff|voidmagic|icemagic|blunderbuss|greatsword).*/,
        /^ui_.*_mastery$/,
        /^ui_.*_tree1$/,
        /^ui_.*_tree2$/,
        'ui_sword',
        'ui_shield',
        'ui_blood',
        'ui_evade',
        'ui_juggernaut',
        'ui_crowdcrusher',
        'ui_onehanded_weapons',
        'ui_twohanded_weapons',
        'ui_ranged_weapons',
        'ui_magic_skills',
        'ui_available_points',
        'ui_level'
      ],
    }).then((files) => {
      checkExpressions({
        locales: files,
        output: './tmp/expressions.json',
      })
    })
    console.log('importing images')
    await importImages({
      input: inputDir,
      output: distDir,
      tables,
      ignoreKeys: ['HiResIconPath'],
      rewrite: {
        ArmorAppearanceF: (key, value, obj) => `lyshineui/images/icons/items/${obj.ItemType}/${value}`,
        ArmorAppearanceM: (key, value, obj) => `lyshineui/images/icons/items/${obj.ItemType}/${value}`,
        WeaponAppearanceOverride: (key, value, obj) => `lyshineui/images/icons/items/${obj.ItemType}/${value}`,
      },
      rewritePath: (value) => {
        return path.join(publicDir, value).replace(/\\/g, '/')
      },
    })
    console.log('writing datatables')
    await processArrayWithProgress(tables, async ({ relative, data }) => {
      const jsonPath = path.join(distDir, 'datatables', relative)
      await writeJSONFile(data, jsonPath, {
        createDir: true,
      })
    })

    console.log('generate types')
    await generateTypes(typesDir, tables)
  })
  .parse(process.argv)
