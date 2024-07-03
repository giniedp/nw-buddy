import { inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON, getItemId } from '@nw-data/common'
import { AffixStatData, StatusEffectData } from '@nw-data/generated'
import { flatten, uniq } from 'lodash'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { humanize, mapList, rejectKeys, selectSignal } from '~/utils'
import { ModelsService } from '~/widgets/model-viewer'

export interface StatusEffectDetailState {
  effectId: string
}
export const StatusEffectDetailStore = signalStore(
  withState<StatusEffectDetailState>({ effectId: null }),
  withComputed(({ effectId }, db = inject(NwDataService)) => {
    const effect = selectSignal(db.statusEffect(effectId))
    const onHitAffixId = selectSignal(effect, (it) => it?.OnHitAffixes)
    const affix = selectSignal(db.affixStat(onHitAffixId))
    return {
      effect,
      affix,
    }
  }),
  withComputed(({ effect, affix }) => {
    return {
      isNegative: selectSignal(effect, (it) => it?.IsNegative),
      icon: selectSignal(effect, (it) => it?.PlaceholderIcon || NW_FALLBACK_ICON),
      name: selectSignal(effect, (it) => it?.DisplayName),
      nameForDisplay: selectSignal(effect, (it) => it?.DisplayName || humanize(it?.StatusID)),
      source: selectSignal(effect, (it) => it?.['$source']),
      description: selectSignal(effect, (it) => it?.Description),
      properties: selectSignal(effect, selectProperties),
      affixProps: selectSignal(affix, selectAffixProperties),
      refEffects: selectSignal(effect, selectStatusEffectReferences),
      refAbilities: selectSignal(effect, (it) => uniq(flatten([it?.EquipAbility])).filter((e) => !!e)),
    }
  }),
  withComputed(({ effectId }) => {
    const db = inject(NwDataService)

    const foreignAbilities = selectSignal(
      [
        db.abilitiesByStatusEffect(effectId).pipe(map((it) => it || [])),
        db.abilitiesBySelfApplyStatusEffect(effectId).pipe(map((it) => it || [])),
        db.abilitiesByOtherApplyStatusEffect(effectId).pipe(map((it) => it || [])),
      ],
      (abilities) => {
        return uniq(flatten(abilities).map((it) => it?.AbilityID)).filter((it) => !!it)
      },
    )

    const foreignAffixStats = selectSignal(db.affixByStatusEffect(effectId), (list) => {
      return uniq(flatten(list || []).map((it) => it?.StatusID)).filter((it) => !!it)
    })

    const foreignPerks = selectSignal(
      {
        abilities: toObservable(foreignAbilities).pipe(switchMap((it) => perksByAbilities(it, db))),
        affixes: toObservable(foreignAffixStats).pipe(switchMap((it) => perksByAffix(it, db))),
      },
      ({ abilities, affixes }) => {
        return uniq([...(abilities || []), ...(affixes || [])]).filter((it) => !!it)
      },
    )

    const foreignItems = selectSignal(
      [
        db
          .housingItemsByStatusEffect(effectId)
          .pipe(map((it) => it || []))
          .pipe(mapList(getItemId)),
        db
          .consumablesByAddStatusEffects(effectId)
          .pipe(map((it) => it || []))
          .pipe(mapList((it) => it.ConsumableID)),
      ],
      (list) => list.flat().filter((it) => !!it),
    )

    const foreignDamageTables = selectSignal(
      [db.damageTablesByStatusEffect(effectId).pipe(map((it) => it || []))],
      (list) => list.flat().filter((it) => !!it),
    )

    return {
      foreignAbilities,
      foreignAffixStats,
      foreignPerks,
      foreignItems,
      foreignDamageTables,
    }
  }),
  withComputed(({ effect }) => {
    const costumeChangeId = selectSignal(effect, (it) => it?.CostumeChangeId)
    const costumeModel$ = inject(ModelsService).byCostumeId(toObservable(costumeChangeId))
    return {
      costumeModels: toSignal(costumeModel$),
    }
  }),
  withMethods((state) => {
    return {
      load(idOrItem: string | StatusEffectData) {
        console.log('load', idOrItem)
        if (typeof idOrItem === 'string') {
          patchState(state, { effectId: idOrItem })
        } else {
          patchState(state, { effectId: idOrItem?.StatusID })
        }
      },
    }
  }),
)

function selectProperties(item: StatusEffectData) {
  const reject = ['$source', 'PlaceholderIcon']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}

function selectAffixProperties(item: AffixStatData) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}

function selectStatusEffectReferences(item: StatusEffectData) {
  return uniq(
    flatten([
      item?.OnDeathStatusEffect,
      item?.OnEndStatusEffect,
      item?.OnStackStatusEffect,
      item?.OnTickStatusEffect,
      item?.RemoveStatusEffects,
    ]),
  )
    .filter((e) => !!e && e !== 'Debuff')
    .filter((e) => e !== item.StatusID)
}

function perksByAffix(affix: string[], db: NwDataService): Observable<string[]> {
  if (!affix?.length) {
    return of<string[]>([])
  }
  return combineLatest(
    affix.map((it) => {
      return db.perksByAffix(it).pipe(map((it) => it || []))
    }),
  )
    .pipe(map(flatten))
    .pipe(mapList((it) => it.PerkID))
}

function perksByAbilities(abilities: string[], db: NwDataService): Observable<string[]> {
  if (!abilities?.length) {
    return of<string[]>([])
  }
  return combineLatest(
    abilities.map((it) => {
      return db.perksByEquipAbility(it).pipe(map((it) => it || []))
    }),
  )
    .pipe(map(flatten))
    .pipe(mapList((it) => it.PerkID))
}
