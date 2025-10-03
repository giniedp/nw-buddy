import { computed } from '@angular/core'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import {
  getZoneBackground,
  getZoneDescription,
  getZoneIcon,
  getZoneMetaId,
  getZoneName,
  getZoneType,
} from '@nw-data/common'
import { TerritoryDefinition, VitalsBaseData, VitalsLevelVariantData } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { rejectKeys, resourceValue } from '~/utils'

export interface ZoneSpawn {
  vital: VitalsData
  point: number[]
  levels: number[]
  categories: string[]
}
type VitalsData = VitalsBaseData & VitalsLevelVariantData

export interface ZoneDetailState {
  recordId: number
  markedVitalId?: string
}

export const ZoneDetailStore = signalStore(
  withState<ZoneDetailState>({
    recordId: null,
    markedVitalId: null,
  }),
  withComputed(({ recordId }) => {
    const db = injectNwData()
    const value = resourceValue({
      keepPrevious: true,
      params: recordId,
      loader: async ({ params }) => {
        const recordId = params
        const record = await db.territoriesById(recordId)
        const metaId = getZoneMetaId(record)
        const metadata = await db.territoriesMetadataById(metaId)
        return {
          recordId,
          record,
          metaId,
          metadata,
        }
      },
    })
    return {
      record: computed(() => value()?.record),
      metaId: computed(() => value()?.metaId),
      metadata: computed(() => value()?.metadata),
    }
  }),
  withMethods((state) => {
    return {
      markVital: (markedVitalId: string) => {
        patchState(state, { markedVitalId })
      },
      load: signalMethod(({ territoryId }: { territoryId: number | string }) => {
        patchState(state, {
          recordId: Number(territoryId),
        })
      }),
    }
  }),
  withComputed(({ record }) => {
    return {
      icon: computed(() => getZoneIcon(record())),
      image: computed(() => getZoneBackground(record())),
      name: computed(() => getZoneName(record())),
      description: computed(() => getZoneDescription(record())),
      properties: computed(() => selectProperties(record())),
      type: computed(() => getZoneType(record())),
    }
  }),
)

function selectProperties(item: TerritoryDefinition) {
  const reject = ['NameLocalizationKey', 'MapIcon', 'Description', 'IconPath', 'TooltipBackground']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}
