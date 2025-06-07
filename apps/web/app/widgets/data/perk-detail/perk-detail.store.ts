import { computed, inject } from '@angular/core'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON, getAffixMODs, getPerkItemClassGSBonus, hasPerkScalingPerGearScore } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { AbilityData, AffixStatData, MasterItemDefinitions, PerkData } from '@nw-data/generated'
import { Observable, combineLatest, from, map, of, switchMap } from 'rxjs'
import { injectNwData, withStateLoader } from '~/data'
import { NwTextContextService } from '~/nw/expression'
import { combineLatestOrEmpty, rejectKeys, selectSignal, selectStream } from '~/utils'
import { diffResourceFor } from '~/widgets/diff-tool'

export interface PerkDetailStoreState {
  perkId: string
  perk: PerkData
  affix: AffixStatData
  abilities: AbilityData[]
  refAbilities: string[]
  refEffects: string[]
  resourceItems: MasterItemDefinitions[]
}

export type PerkDetailStore = InstanceType<typeof PerkDetailStore>
export const PerkDetailStore = signalStore(
  withState<PerkDetailStoreState>({
    perkId: null,
    perk: null,
    affix: null,
    abilities: [],
    refAbilities: [],
    refEffects: [],
    resourceItems: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load(perkId: string) {
        return loadState(db, perkId)
      },
    }
  }),
  withComputed(({ perk, affix }) => {
    return {
      icon: computed(() => perk()?.IconPath || NW_FALLBACK_ICON),
      type: computed(() => perk()?.PerkType),
      name: computed(() => perk()?.DisplayName || perk()?.SecondaryEffectDisplayName),
      description: computed(() => perk()?.Description),
      properties: computed(() => selectProperties(perk())),
      modsInfo: computed(() => getAffixMODs(affix())),
      affixProps: computed(() => selectAffixProperties(affix())),

      scalesWithGearScore: computed(() => !!hasPerkScalingPerGearScore(perk())),
      itemClassGsBonus: computed(() => getPerkItemClassGSBonus(perk())),
    }
  }),
  withComputed(({ perk, perkId }) => {
    return {
      diffResource: computed(() => diffResourceFor(perk(), ['PerkID'])),
      recordCode: computed(() => JSON.stringify(perk(), null, 2)),
    }
  }),
  withComputed(({ perk }) => {
    const context = inject(NwTextContextService)
    const textContext = selectSignal(
      {
        perk: perk,
        context: context.state$,
      },
      ({ perk, context }) => {
        const result = {
          itemId: perk?.PerkID,
          gearScore: context.gearScore,
          charLevel: context.charLevel,
        }
        if (context.gearScoreBonus) {
          const gsBonus = getPerkItemClassGSBonus(perk)
          result.gearScore += gsBonus?.value || 0
        }
        return result
      },
    )

    const textContextClass = selectSignal(
      {
        perk: perk,
        context: context.state$,
      },
      ({ perk, context }) => {
        const result = {
          itemId: perk?.PerkID,
          gearScore: context.gearScore,
          charLevel: context.charLevel,
        }
        const gsBonus = getPerkItemClassGSBonus(perk)
        result.gearScore += gsBonus?.value || 0
        return result
      },
    )

    return {
      textContext,
      textContextClass,
    }
  }),
)

function loadState(db: NwData, perkId: string): Observable<PerkDetailStoreState> {
  const perk$ = from(db.perksById(perkId))
  const affix$ = perk$.pipe(
    map((it) => it?.Affix),
    switchMap((it) => db.affixStatsById(it)),
  )
  const refAbilities$ = perk$.pipe(map((it) => it?.EquipAbility || []))
  const abilities$ = refAbilities$.pipe(switchMap((it) => combineLatestOrEmpty(it?.map((id) => db.abilitiesById(id)))))

  const refEffects$ = selectStream(
    {
      affix: affix$,
      abilities: abilities$,
    },
    ({ affix, abilities }) => {
      const result: string[] = []
      if (affix?.StatusEffect) {
        result.push(affix.StatusEffect)
      }
      abilities
        ?.filter((it) => !!it)
        ?.forEach((it) => {
          if (it.SelfApplyStatusEffect?.length) {
            result.push(...it.SelfApplyStatusEffect)
          }
          if (it.OtherApplyStatusEffect?.length) {
            result.push(...it.OtherApplyStatusEffect)
          }
          if (it.StatusEffect) {
            result.push(it.StatusEffect)
          }
        })
      return result.length ? result : null
    },
  )

  const resourceItems$ = selectStream(
    {
      perkBuckets: db.perkBucketsByPerkIdMap(),
      resources: db.resourceItemsByPerkBucketIdMap(),
      items: db.itemsByIdMap(),
    },
    ({ perkBuckets, resources, items }) => {
      const buckets = perkBuckets.get(perkId)
      const resourcesList = buckets
        ?.map((it) => resources.get(it.PerkBucketID))
        .flat()
        .filter((it) => !!it)
      return resourcesList?.map((it) => items.get(it.ResourceID)).filter((it) => !!it)
    },
  )

  return combineLatest({
    perkId: of(perkId),
    perk: perk$,
    affix: affix$,
    abilities: abilities$,
    refAbilities: refAbilities$,
    refEffects: refEffects$,
    resourceItems: resourceItems$,
  })
}

function selectProperties(item: PerkData) {
  const reject: Array<keyof PerkData> = ['IconPath', 'DisplayName', 'Description']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}

function selectAffixProperties(item: AffixStatData) {
  return rejectKeys(item, (key) => !item[key] || key.startsWith('$'))
}
