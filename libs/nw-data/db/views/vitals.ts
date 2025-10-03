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
  const result = vitals.filter((it) => {
    if (!isInDungeon(it)) {
      return false
    }
    if (!creatureType) {
      return true
    }
    return creatureType.some((type) => eqCaseInsensitive(type, it.CreatureType))
  })

  console.log('vitalsForGameModeMap', {
    gameMapId,
    result,
  })
  return result
}

export async function vitalsForMapId(
  db: NwDataSheets,
  params: {
    mapId: string
  },
) {
  const { mapId } = params

  const vitals = await db.vitalsAll()
  const vitalsMeta = await db.vitalsMetadataByIdMap()

  const result = vitals.filter((it) => {
    const meta = vitalsMeta.get(it.VitalsID)
    return !!meta?.mapIDs?.includes(mapId)
  })
  console.log('vitalsForMapId', {
    mapId,
    result,
  })
  return result
}

export async function vitalsForTerritoryId(
  db: NwDataSheets,
  params: {
    territoryId: string | number
  },
) {
  const territoryId = Number(String(params.territoryId))
  if (!(territoryId >= 0)) {
    return []
  }
  const vitals = await db.vitalsAll()
  const vitalsMeta = await db.vitalsMetadataByIdMap()

  const result = vitals.filter((it) => {
    const meta = vitalsMeta.get(it.VitalsID)
    return !!meta?.territories?.includes(territoryId)
  })
  return result
}
