import { inject } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { signalStore, withComputed, withState } from '@ngrx/signals'
import { NW_FALLBACK_ICON, getItemId } from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { AffixStatData, DamageData, SpellData, StatusEffectData } from '@nw-data/generated'
import { flatten, uniq } from 'lodash'
import { injectNwData, withStateLoader } from '~/data'
import { humanize, rejectKeys, selectSignal } from '~/utils'
import { ModelsService } from '~/widgets/model-viewer'

export interface StatusEffectDetailState {
  effectId: string
  effect: StatusEffectData
  affix: AffixStatData
  foreignAbilities: string[]
  foreignAffixStats: string[]
  foreignPerks: string[]
  foreignItems: string[]
  foreignDamageTables: Array<DamageData & { $source: string }>
  foreignSpells: SpellData[]
}
export const StatusEffectDetailStore = signalStore(
  withState<StatusEffectDetailState>({
    effectId: null,
    effect: null,
    affix: null,
    foreignAbilities: [],
    foreignAffixStats: [],
    foreignPerks: [],
    foreignItems: [],
    foreignDamageTables: [],
    foreignSpells: [],
  }),
  withStateLoader(() => {
    const db = injectNwData()
    return {
      load: async (effectId: string) => {
        const effect = await db.statusEffectsById(effectId)
        const affix$ = db.affixStatsById(effect?.OnHitAffixes)
        const abilities$ = loadForeignAbilities(db, effectId)
        const affixstat$ = loadForeignAffixStats(db, effectId)
        const perks$ = loadForeignPerks(db, {
          abilities: await abilities$,
          affixes: await affixstat$,
        })
        const items$ = loadForeignItems(db, effectId)
        const damageTables$ = loadForeignDamageTables(db, effectId)
        const spells$ = loadForeignSpells(db, effectId)
        return {
          effectId,
          effect,
          affix: await affix$,
          foreignAbilities: await abilities$,
          foreignAffixStats: await affixstat$,
          foreignPerks: await perks$,
          foreignItems: await items$,
          foreignDamageTables: await damageTables$,
          foreignSpells: await spells$,
        }
      },
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
  withComputed(({ effect }) => {
    const costumeChangeId = selectSignal(effect, (it) => it?.CostumeChangeId)
    const costumeModel$ = inject(ModelsService).byCostumeId(toObservable(costumeChangeId))
    return {
      costumeModels: toSignal(costumeModel$),
    }
  }),
)

function selectProperties(item: StatusEffectData) {
  const reject = ['PlaceholderIcon']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key) || key.startsWith('$'))
}

function selectAffixProperties(item: AffixStatData) {
  return rejectKeys(item, (key) => !item[key] || key.startsWith('$'))
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

async function loadForeignAbilities(db: NwData, effectId: string) {
  return Promise.all([
    db.abilitiesByStatusEffect(effectId),
    db.abilitiesBySelfApplyStatusEffect(effectId),
    db.abilitiesByOtherApplyStatusEffect(effectId),
  ])
    .then((l) => l.flat(1))
    .then((l) => l.map((it) => it?.AbilityID))
    .then((l) => l.filter((it) => !!it))
    .then((l) => uniq(l))
}

async function loadForeignAffixStats(db: NwData, effectId: string) {
  return db
    .affixByStatusEffect(effectId)
    .then((l) => l || [])
    .then((l) => l.map((it) => it?.StatusID))
    .then((l) => l.filter((it) => !!it))
    .then((l) => uniq(l))
}

async function loadForeignPerks(db: NwData, options: { abilities: string[]; affixes: string[] }) {
  return await Promise.all([
    //
    loadPerksByAbilities(db, options.abilities),
    loadPerksByAffix(db, options.affixes),
  ])
    .then((l) => l.flat(1))
    .then((l) => l.filter((it) => !!it))
    .then((l) => uniq(l))
}

async function loadForeignItems(db: NwData, effectId: string) {
  const housingItems = db
    .housingItemsByStatusEffect(effectId)
    .then((l) => l || [])
    .then((l) => l.map(getItemId))
  const consumables = db
    .consumableItemsByAddStatusEffects(effectId)
    .then((l) => l || [])
    .then((l) => l.map((it) => it.ConsumableID))

  return Promise.all([housingItems, consumables])
    .then((l) => l.flat(1))
    .then((l) => l.filter((it) => !!it))
    .then((l) => uniq(l))
}

async function loadForeignDamageTables(db: NwData, effectId: string) {
  return db
    .damageTablesByStatusEffect(effectId)
    .then((l) => l || [])
    .then((l) => l.filter((it) => !!it))
}

async function loadForeignSpells(db: NwData, effectId: string) {
  return db
    .spellsByStatusEffectId(effectId)
    .then((l) => l || [])
    .then((l) => l.filter((it) => !!it))
}

async function loadPerksByAffix(db: NwData, affix: string[]) {
  if (!affix?.length) {
    return []
  }
  const perks = await Promise.all(
    affix.map((it) => {
      return db.perksByAffix(it)
    }),
  ).then((it) => flatten(it || []))
  return uniq(perks.map((it) => it?.PerkID))
}

async function loadPerksByAbilities(db: NwData, abilities: string[]) {
  if (!abilities?.length) {
    return []
  }
  const perks = await Promise.all(
    abilities.map((it) => {
      return db.perksByEquipAbility(it)
    }),
  ).then((it) => flatten(it || []))
  return uniq(perks.map((it) => it?.PerkID))
}
