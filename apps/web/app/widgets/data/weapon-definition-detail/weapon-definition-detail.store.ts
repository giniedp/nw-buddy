import { computed, resource } from '@angular/core'
import { patchState, signalMethod, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { WeaponItemDefinitions } from '@nw-data/generated'
import { injectNwData } from '~/data'
import { rejectKeys, resourceValueOf } from '~/utils'
import { getWeaponTypeByProgressionId } from '../../../nw/weapon-types'

export interface WeaponDefinitionDetailState {
  recordId: string
}
export const WeaponDefinitionDetailStore = signalStore(
  withState<WeaponDefinitionDetailState>({
    recordId: null,
  }),
  withMethods((state) => {
    return {
      load: signalMethod((recordId: string) => {
        patchState(state, { recordId })
      }),
    }
  }),
  withProps(({ recordId }) => {
    const db = injectNwData()
    const dataResource = resource({
      params: () => {
        return {
          recordId: recordId(),
        }
      },
      loader: async ({ params: { recordId } }) => {
        const record = await db.weaponItemsById(recordId)
        return {
          record,
        }
      },
      defaultValue: {
        record: null,
      },
    })
    const data = resourceValueOf(dataResource, {
      keepPrevious: true,
    })
    return {
      isLoading: dataResource.isLoading,
      isLoaded: computed(() => !!data().record || !dataResource.isLoading() || dataResource.hasValue()),
      hasError: computed(() => !!dataResource.error()),
      record: computed(() => data().record),
      properties: computed(() => selectProperties(data().record)),
    }
  }),
  withComputed(({ record }) => {
    return {
      icon: computed(() => {
        return getWeaponTypeByProgressionId(record()?.WeaponMasteryCategoryId)?.IconPathSmall || NW_FALLBACK_ICON
      }),
      hasScaling: computed(() => {
        return (
          !!record()?.ScalingDexterity ||
          !!record()?.ScalingFocus ||
          !!record()?.ScalingIntelligence ||
          !!record()?.ScalingStrength
        )
      }),
    }
  }),
)

function selectProperties(item: WeaponItemDefinitions) {
  const reject: Array<keyof WeaponItemDefinitions> = []
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}
