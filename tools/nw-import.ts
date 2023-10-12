import { program } from 'commander'
import * as path from 'path'
import { environment, NW_USE_PTR } from '../env'
import { generateTypes } from './code-gen/code-generate'
import { extractExpressions } from './importer/extractExpressions'
import { importImages } from './importer/images'
import {
  importDatatables,
  pathToDatatables,
  rewriteImagePathRule,
  TABLE_GLOB_PATTERNS,
  TABLE_REMAP_RULES,
} from './importer/tables'
import { importLocales, LOCALE_KEYS_TO_KEEP } from './importer/locales'
import { importSlices } from './importer/slices/import-slices'
import { withProgressBar, writeJSONFile } from './utils'
import { cpus } from 'os'
import { generateSearch } from './importer/search'
import { extractLootTags } from './importer/extractLootTags'
function collect(value: string, previous: string[]) {
  return previous.concat(value.split(','))
}

function hasFilter(filter: string, filters: string[]) {
  return !filters?.length || filters.includes(filter)
}

enum Importer {
  types = 'types',
  tables = 'tables',
  locales = 'locales',
  images = 'images',
  vitals = 'vitals',
  index = 'index',
}

program
  .option('-i, --input <path>', 'input directory')
  .option('-u, --update', 'Update existing files from previous import')
  .option('-m, --module <module>', 'Specific importer module to run', collect, [])
  .option('-t, --threads <threads>', 'Number of worker threads', Number)
  .option('--ptr', 'PTR mode', NW_USE_PTR)
  .action(async () => {
    const options = program.opts<{
      input: string
      output: string
      ptr: boolean
      update: boolean
      module: string[]
      threads: number
    }>()
    const inputDir = options.input || environment.nwConvertDir(options.ptr)!
    const distDir = environment.nwDataDir(options.ptr)!
    const typesDir = environment.libsDir('nw-data', 'generated')
    const threads = options.threads || cpus().length

    console.log('[IMPORT]', inputDir)
    console.log('     to:', distDir)
    console.log('  types:', typesDir)
    console.log('modules:', options.module?.length ? options.module : 'ALL')
    console.log(' threads:', threads)

    if (options.module.some((it) => !Importer[it])) {
      throw new Error(`Unknown importer module: ${options.module}`)
    }

    if (hasFilter(Importer.vitals, options.module)) {
      console.log('Slices')
      await importSlices({
        inputDir,
        threads,
      }).then(({ gatherables, vitals }) => {
        return Promise.all([
          // write it into input directory, so table loader will pick it up
          writeJSONFile(vitals, path.join(pathToDatatables(inputDir), 'generated_vitalsmetadata.json'), {
            createDir: true,
          }),
          writeJSONFile(vitals, path.join('tmp', 'vitals.json'), {
            createDir: true,
          }),

          // write it into input directory, so table loader will pick it up
          writeJSONFile(gatherables, path.join(pathToDatatables(inputDir), 'generated_gatherablesmetadata.json'), {
            createDir: true,
          }),
          writeJSONFile(gatherables, path.join('tmp', 'gatherables.json'), {
            createDir: true,
          }),
        ])
      })
    }

    console.log('Tables')
    const tables = await importDatatables({
      inputDir: inputDir,
      patterns: TABLE_GLOB_PATTERNS,
      remap: TABLE_REMAP_RULES,
      rewrite: [rewriteImagePathRule(inputDir)],
    })

    if (hasFilter(Importer.locales, options.module)) {
      console.log('Locales')
      const localesDir = path.join(distDir, 'localization')
      await importLocales({
        input: inputDir,
        output: localesDir,
        tables: tables.map(({ data }) => data),
        preserveKeys: LOCALE_KEYS_TO_KEEP,
      })
      console.log('Expressions')
      await extractExpressions({
        input: localesDir,
        output: './tmp/expressions.json',
      })
    }

    if (hasFilter(Importer.images, options.module)) {
      console.log('Images')
      await importImages({
        staticImages: [
          'LyShineUI/Images/Icon_Crown',
          'LyShineUI/Images/Icons/Misc/icon_hourglass.png',
          'LyShineUI/Images/Icons/Misc/icon_hourglass_yellow.png',
          'LyShineUI/Images/Icons/Misc/icon_question_orange',
          'LyShineUI/Images/SeasonsRewards/Wild-Stamp-Icon-Small',
          'LyShineUI/Images/SeasonsRewards/pip',
          'LyShineUI/Images/icons/misc/icon_character',
          'LyShineUI/Images/icons/misc/icon_level_simple',
          'LyShineUI/Images/icons/misc/icon_question_orange',
          'LyShineUI/Images/icons/twitch/twitch_iconAddGroup',
          'LyShineUI/Images/icons/twitch/twitch_iconAddGuild',
          'LyShineUI/Images/socialpane/social_iconAddGroup',
          'LyShineUI/Images/socialpane/social_iconAddGuild',
          'lyshineui/images/dungeons/mutator_rank_gold_sm',
          'lyshineui/images/encumbrance/iconExclamation',
          'lyshineui/images/icon_crown',
          'lyshineui/images/icons/contracts/contracts_iconBrowse',
          'lyshineui/images/icons/contracts/contracts_iconBuy',
          'lyshineui/images/icons/contracts/contracts_iconMyorders',
          'lyshineui/images/icons/contracts/contracts_iconSell',
          'lyshineui/images/icons/crafting/icon_skin_mask',
          'lyshineui/images/icons/crafting/icon_skin_mask_tan',
          'lyshineui/images/icons/crossworld/icon_crossworld_identifier',
          'lyshineui/images/icons/crossworld/icon_crossworld_identifier_tan',
          'lyshineui/images/icons/hud/vitals/Icon_combatstate',
          'lyshineui/images/icons/items/currency/transmogtokensmall',
          'lyshineui/images/icons/misc/Icon_LeftMouseButton',
          'lyshineui/images/icons/misc/Icon_MiddleMouseButton',
          'lyshineui/images/icons/misc/Icon_RightMouseButton',
          'lyshineui/images/icons/misc/arrow_right',
          'lyshineui/images/icons/misc/icon_azothCurrency',
          'lyshineui/images/icons/misc/icon_azoth_salt',
          'lyshineui/images/icons/misc/icon_day',
          'lyshineui/images/icons/misc/icon_exclamation_white_small',
          'lyshineui/images/icons/misc/icon_gearscore',
          'lyshineui/images/icons/misc/icon_gearscore_tan',
          'lyshineui/images/icons/misc/icon_hourglass',
          'lyshineui/images/icons/misc/icon_hwm_small_color',
          'lyshineui/images/icons/misc/icon_hwm_small_red',
          'lyshineui/images/icons/misc/icon_microphone',
          'lyshineui/images/icons/misc/icon_night',
          'lyshineui/images/icons/misc/icon_question_orange',
          'lyshineui/images/icons/misc/icon_refresh',
          'lyshineui/images/icons/misc/icon_territoryStanding',
          'lyshineui/images/icons/misc/icon_upgrade',
          'lyshineui/images/icons/misc/icon_warsmall_white',
          'lyshineui/images/icons/misc/icon_xp',
          'lyshineui/images/icons/misc/icon_xp_boost',
          'lyshineui/images/icons/misc/infinity_tan',
          'lyshineui/images/icons/objectives/reward_coin',
          'lyshineui/images/icons/tooltip/icon_tooltip_arcane_opaque',
          'lyshineui/images/icons/tooltip/icon_tooltip_bleed_opaque',
          'lyshineui/images/icons/tooltip/icon_tooltip_bundle',
          'lyshineui/images/icons/tooltip/icon_tooltip_fire_opaque',
          'lyshineui/images/icons/tooltip/icon_tooltip_ice_opaque',
          'lyshineui/images/icons/tooltip/icon_tooltip_nature_opaque',
          'lyshineui/images/icons/tooltip/icon_tooltip_purchase',
          'lyshineui/images/icons/tooltip/icon_tooltip_repair',
          'lyshineui/images/icons/tooltip/icon_tooltip_salvage',
          'lyshineui/images/icons/tooltip/icon_tooltip_slash_opaque',
          'lyshineui/images/icons/tooltip/icon_tooltip_strike_opaque',
          'lyshineui/images/icons/tooltip/icon_tooltip_thrust_opaque',
          'lyshineui/images/icons/tooltip/icon_tooltip_void_opaque',
          'lyshineui/images/map/icon/pois/fish_hotspot_sm',
          'lyshineui/images/map/icon/pois/maudlinbug',
          'lyshineui/images/map/icon/pois/transmog',
          'lyshineui/images/mtx/icon_mtx_currency',
          'lyshineui/images/objectives/journal/guidestab/fasttraveliconactive',
          'lyshineui/images/objectives/journal/guidestab/fasttraveliconinactive',
          'lyshineui/images/tooltip/tooltip_bullet',
          'lyshineui/images/tooltipimages/fishinghotspotactive.png',
          'lyshineui/images/tooltipimages/fishinghotspotdepleted.png',
        ],
        input: inputDir,
        output: distDir,
        update: options.update,
        tables: tables.map(({ data }) => data),
        shouldIgnore: (key, img, obj) => {
          if (key !== 'HiResIconPath') {
            return false
          }
          if ('MountId' in obj) {
            return false
          }
          return true
        },
        threads: threads,
        rewritePath: (value) => {
          return path.join('nw-data', value).replace(/\\/g, '/')
        },
      })
    }

    if (hasFilter(Importer.tables, options.module)) {
      console.log('Tables')
      await withProgressBar({ barName: 'Write', tasks: tables }, async ({ relative, data }, _, log) => {
        const jsonPath = path.join(distDir, 'datatables', relative)
        log(jsonPath)
        await writeJSONFile(data, jsonPath, {
          createDir: true,
        })
      })

      // console.log('collect abilities')
      // await extractAbilities(inputDir, 'tmp')

      // console.log('check damage tables')
      // checkDamageTables(tables)
    }

    if (hasFilter(Importer.types, options.module)) {
      console.log('generate types')
      await generateTypes(typesDir, tables)
    }

    if (hasFilter(Importer.index, options.module)) {
      console.log('generate search')
      await generateSearch({
        localesDir: path.join(distDir, 'localization'),
        tablesDir: path.join(distDir, 'datatables'),
        outDir: path.join(distDir, 'search'),
      })

      // console.log('collect loot tags')
      // await extractLootTags({
      //   tablesDir: path.join(distDir, 'datatables'),
      //   outFile: path.join('tmp', 'loot-tags.json'),
      // })
    }
  })
  .parse(process.argv)
