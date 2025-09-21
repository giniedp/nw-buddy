import { getVitalGameModeMaps } from '@nw-data/common'
import type { CreatureType, VitalsBaseData } from '@nw-data/generated'
import { eqCaseInsensitive } from 'libs/nw-data/common/utils/caseinsensitive-compare'
import type { NwDataSheets } from '../nw-data-sheets'

export async function vitalsForGameModeMap(
  db: NwDataSheets,
  params: {
    gameMapId: string
    mutated?: boolean
    creatureType?: CreatureType[]
  },
) {
  const { gameMapId, mutated, creatureType } = params
  const isStarstone = eqCaseInsensitive(gameMapId, 'DungeonShatteredObelisk')
  const vitals = await db.vitalsAll()
  const vitalsMeta = await db.vitalsMetadataByIdMap()

  const gameModeMap = await db.gameModesMapsById(gameMapId)
  const gameModeMaps = [gameModeMap].filter((it) => !!it)

  function isInDungeon(vital: VitalsBaseData) {
    if (mutated && isStarstone && eqCaseInsensitive(vital.VitalsID, 'Withered_Brute_Named_08')) {
      return true
    }
    return !!getVitalGameModeMaps(vital, gameModeMaps, vitalsMeta).length
  }
  return vitals.filter((it) => {
    if (!isInDungeon(it)) {
      return false
    }
    if (!creatureType) {
      return true
    }
    return creatureType.some((type) => eqCaseInsensitive(type, it.CreatureType))
  })
}
