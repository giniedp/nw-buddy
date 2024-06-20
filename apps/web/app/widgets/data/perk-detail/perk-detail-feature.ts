import { computed, inject } from '@angular/core'
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { NW_FALLBACK_ICON, getAffixMODs, getPerkItemClassGSBonus } from '@nw-data/common'
import { AffixStatData, PerkData } from '@nw-data/generated'
import { map, pipe, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { withNwData } from '~/data/with-nw-data'
import { rejectKeys } from '~/utils'

export interface PerkDetailState {
  perkId: string
  perk: PerkData
}

export function withPerkDetail() {
  signalStoreFeature(
    withState<PerkDetailState>({
      perkId: null,
      perk: null,
    }),
    withNwData((db) => {
      return {
        itemsMap: db.itemsMap,
        abilitiesMap: db.abilitiesMap,
        affixstatsMap: db.affixStatsMap,
        perkBucketsByPerkIdMap: db.perkBucketsByPerkIdMap,
        resourcesByPerkBucketIdMap: db.resourcesByPerkBucketIdMap,
      }
    }),
    withMethods((state) => {
      const data = inject(NwDataService)
      return {
        load: rxMethod<string>(
          pipe(
            switchMap((id) => data.perk(id)),
            map((perk) => {
              patchState(state, { perkId: perk?.PerkID, perk })
            }),
          ),
        ),
      }
    }),
    withComputed(
      ({ perk, perkId, nwData: { affixstatsMap, perkBucketsByPerkIdMap, resourcesByPerkBucketIdMap, itemsMap } }) => {
        const affixId = computed(() => perk()?.Affix)
        const affix = computed(() => affixstatsMap()?.get(affixId()))
        return {
          scalesWithGearScore: computed(() => !!perk()?.ScalingPerGearScore),
          itemClassGsBonus: computed(() => getPerkItemClassGSBonus(perk())),
          icon: computed(() => perk()?.IconPath || NW_FALLBACK_ICON),
          type: computed(() => perk()?.PerkType),
          name: computed(() => perk()?.DisplayName || perk()?.SecondaryEffectDisplayName),
          description: computed(() => perk()?.Description),
          properties: computed(() => selectProperties(perk())),
          modsInfos: computed(() => getAffixMODs(affix())),
          affixId,
          affix,
          affixProps: computed(() => selectAffixProperties(affix())),
          resourceItems: computed(() => {
            const buckets = perkBucketsByPerkIdMap()?.get(perkId())
            const resources = buckets
              ?.map((it) => resourcesByPerkBucketIdMap()?.get(it.PerkBucketID))
              .flat()
              .filter((it) => !!it)
            return resources?.map((it) => itemsMap()?.get(it.ResourceID)).filter((it) => !!it)
          }),
        }
      },
    ),
  )
}

function selectProperties(item: PerkData) {
  const reject = ['$source', 'IconPath', 'DisplayName', 'Description']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}

function selectAffixProperties(item: AffixStatData) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
