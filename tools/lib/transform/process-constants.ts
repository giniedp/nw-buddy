import path from 'node:path'
import { z } from 'zod'
import { readJSONFile } from '../utils'
import { EncumbranceFileSchema, ExpansionFileSchema } from './tables/table-schemas'

const playerAttributesSchema = z.object({
  'player attribute data': z.object({
    'min armor mitigation': z.number(), // 0
    'max armor mitigation': z.number(), // 2
    'physical armor scale factor': z.number(), // 1850
    'elemental armor scale factor': z.number(), // 1850
    'armor set rating exponent': z.number(), // 1.2
    'armor mitigation exponent': z.number(), // 1.2
    'armor rating decimal accuracy': z.number(), // 1
    'base damage compound increase': z.number(), // 0.0112
    'compound increase diminishing multiplier': z.number(), // 0.6667
    'base damage gear score interval': z.number(), // 5
    'min possible weapon gear score': z.number(), // 100
    'diminishing gear score threshold': z.number(), // 500
    'round gearscore up?': z.boolean(), // true
    'gear score rounding interval': z.number(), // 5
    'max points per attribute': z.number(), // 500
    'level damage multiplier': z.number(), // 0.025
    'item rarity data': z.array(
      z.object({
        'rarity level loc string': z.string(),
        'max perk count': z.number(),
      }),
    ),
    'perk generation data': z.object({
      'roll perk on upgrade gs': z.number(), // 600
      'roll perk on upgrade tier': z.number(), // 5
      'roll perk on upgrade perk count': z.number(), // 4
      'crafting result loot bucket': z.string(), // "FixedCraftingResults"
      'perk data per tier': z.array(
        z.object({
          'max perk channel': z.number(),
          'attribute perk bucket': z.string(),
          'crafting gear score perk count': z.array(
            z.object({
              value2: z.array(
                z.object({
                  value1: z.number(),
                  value2: z.number(),
                }),
              ),
            }),
          ),
          'general gear score perk count': z.array(
            z.object({
              value2: z.array(
                z.object({
                  value1: z.number(),
                  value2: z.number(),
                }),
              ),
            }),
          ),
        }),
      ),
    }),
  }),
})

export async function processConstants({ inputDir }: { inputDir: string }) {
  const baseFile = path.join(inputDir, 'sharedassets', 'genericassets', 'playerbaseattributes.pbadb.json')
  const baseData = await readJSONFile(baseFile, playerAttributesSchema)

  const encumbrandeData = await readJSONFile(
    path.join(inputDir, 'sharedassets/springboardentitites/datatables/javelindata_encumbrancelimits.json'),
    EncumbranceFileSchema,
  ).then((table) => table.rows.find((it) => it.ContainerTypeID === 'Player'))

  const expansionData = await readJSONFile(
    path.join(inputDir, 'sharedassets/springboardentitites/datatables/javelindata_expansions.json'),
    ExpansionFileSchema,
  )
  const maxGS = Math.max(...expansionData.rows.map((it) => it.MaxEquipGS || 0))
  const maxLevel = Math.max(...expansionData.rows.map((it) => it.MaxDisplayLevel || 0))
  const maxTradeLevel = Math.max(...expansionData.rows.map((it) => it.MaxTradeskillLevel || 0))

  const pad = baseData['player attribute data']
  const result = {
    NW_MIN_GEAR_SCORE: pad['min possible weapon gear score'],
    NW_MIN_ARMOR_MITIGATION: pad['min armor mitigation'],
    NW_MAX_ARMOR_MITIGATION: pad['max armor mitigation'],
    NW_PHYSICAL_ARMOR_SCALE_FACTOR: pad['physical armor scale factor'],
    NW_ELEMENTAL_ARMOR_SCALE_FACTOR: pad['elemental armor scale factor'],
    NW_ARMOR_SET_RATING_EXPONENT: pad['armor set rating exponent'],
    NW_ARMOR_MITIGATION_EXPONENT: pad['armor mitigation exponent'],
    NW_ARMOR_RATING_DECIMAL_ACCURACY: pad['armor rating decimal accuracy'],
    NW_BASE_DAMAGE_COMPOUND_INCREASE: pad['base damage compound increase'],
    NW_COMPOUND_INCREASE_DIMINISHING_MULTIPLIER: pad['compound increase diminishing multiplier'],
    NW_BASE_DAMAGE_GEAR_SCORE_INTERVAL: pad['base damage gear score interval'],
    NW_MIN_POSSIBLE_WEAPON_GEAR_SCORE: pad['min possible weapon gear score'],
    NW_DIMINISHING_GEAR_SCORE_THRESHOLD: pad['diminishing gear score threshold'],
    NW_ROUND_GEARSCORE_UP: pad['round gearscore up?'],
    NW_GEAR_SCORE_ROUNDING_INTERVAL: pad['gear score rounding interval'],
    NW_MAX_POINTS_PER_ATTRIBUTE: pad['max points per attribute'],
    NW_LEVEL_DAMAGE_MULTIPLIER: pad['level damage multiplier'],

    NW_ITEM_RARITY_DATA: pad['item rarity data'].map((it) => ({
      displayName: it['rarity level loc string'],
      maxPerkCount: it['max perk count'],
    })),
    NW_CRAFTING_RESULT_LOOT_BUCKET: pad['perk generation data']['crafting result loot bucket'],
    NW_ROLL_PERK_ON_UPGRADE_GS: pad['perk generation data']['roll perk on upgrade gs'],
    NW_ROLL_PERK_ON_UPGRADE_TIER: pad['perk generation data']['roll perk on upgrade tier'],
    NW_ROLL_PERK_ON_UPGRADE_PERK_COUNT: pad['perk generation data']['roll perk on upgrade perk count'],
    NW_PERK_GENERATION_DATA: pad['perk generation data']['perk data per tier'].map((it) => ({
      maxPerkChannel: it['max perk channel'],
      gemSlotProbability: it['gem slot probability'],
      attributePerkProbability: it['attribute perk probability'],
      generalGearScorePerkCount: it['general gear score perk count'].map((it) => {
        return it.value2?.map((it) => ({
          v1: it.value1,
          v2: it.value2,
        }))
      }),
      craftingGearScorePerkCount: it['crafting gear score perk count'].map((it) => {
        return it.value2?.map((it) => ({
          v1: it.value1,
          v2: it.value2,
        }))
      }),
      attributePerkBucket: it['attribute perk bucket'],
    })),

    NW_EQUIP_LOAD_RATIO_FAST: encumbrandeData.EquipLoadRatioFast,
    NW_EQUIP_LOAD_RATIO_NORMAL: encumbrandeData.EquipLoadRatioNormal,
    NW_EQUIP_LOAD_RATIO_SLOW: encumbrandeData.EquipLoadRatioSlow,
    NW_EQUIP_LOAD_DAMAGE_MULT_FAST: encumbrandeData.EquipLoadDamageMultFast,
    NW_EQUIP_LOAD_DAMAGE_MULT_NORMAL: encumbrandeData.EquipLoadDamageMultNormal,
    NW_EQUIP_LOAD_DAMAGE_MULT_SLOW: encumbrandeData.EquipLoadDamageMultSlow,
    NW_EQUIP_LOAD_HEAL_MULT_FAST: encumbrandeData.EquipLoadHealMultFast,
    NW_EQUIP_LOAD_HEAL_MULT_NORMAL: encumbrandeData.EquipLoadHealMultNormal,
    NW_EQUIP_LOAD_HEAL_MULT_SLOW: encumbrandeData.EquipLoadHealMultSlow,
    NW_MAX_GEAR_SCORE: maxGS,
    NW_MAX_CHARACTER_LEVEL: maxLevel,
    NW_MAX_TRADESKILL_LEVEL: maxTradeLevel,
  }

  // TODO:
  // export const NW_MIN_POINTS_PER_ATTRIBUTE = 5
  // export const NW_MAX_GEAR_SCORE_UPGRADABLE = 590
  // export const NW_MAX_GEAR_SCORE_BASE = 600
  // export const NW_MAX_WEAPON_LEVEL = 20
  // export const NW_MAX_ENEMY_LEVEL = 70

  return generateCode(result)
}

function generateCode(input: Record<string, any>) {
  return Object.entries(input)
    .map(([key, value]) => {
      let v = JSON.stringify(value)
      if (typeof value === 'object') {
        v = `Object.freeze(${v})`
      }
      return `export const ${key} = ${v}`
    })
    .join('\n')
}
