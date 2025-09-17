import { getVitalGameModeMaps } from '@nw-data/common'
import type { CreatureType, VitalsBaseData } from '@nw-data/generated'
import { eqCaseInsensitive } from 'libs/nw-data/common/utils/caseinsensitive-compare'
import type { NwDataSheets } from '../nw-data-sheets'

export async function vitalsForGameMode(
  db: NwDataSheets,
  params: {
    gameModeId: string
    mutated?: boolean
    creatureType?: CreatureType[]
  },
) {
  const { gameModeId, mutated, creatureType } = params
  const isStarstone = eqCaseInsensitive(gameModeId, 'DungeonShatteredObelisk')
  const vitals = await db.vitalsAll()
  const vitalsMeta = await db.vitalsMetadataByIdMap()
  const gameModes = await db.gameModesMapsAll()
  function isInDungeon(vital: VitalsBaseData) {
    if (mutated && isStarstone && eqCaseInsensitive(vital.VitalsID, 'Withered_Brute_Named_08')) {
      return true
    }
    return getVitalGameModeMaps(vital, gameModes, vitalsMeta).some((dg) => eqCaseInsensitive(dg.GameModeId, gameModeId))
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
