import { Injectable, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON, getItemId } from '@nw-data/common'
import { AffixStatData, StatusEffectData } from '@nw-data/generated'
import { flatten, uniq } from 'lodash'
import { Observable, combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { humanize, mapList, rejectKeys } from '~/utils'
import { ModelsService } from '~/widgets/model-viewer'

@Injectable()
export class StatusEffectDetailStore extends ComponentStore<{ effectId: string }> {
  protected readonly db = inject(NwDataService)
  public readonly effectId$ = this.select(({ effectId }) => effectId)
  public readonly effect$ = this.select(this.db.statusEffect(this.effectId$), (it) => it)

  public readonly isNegative$ = this.select(this.effect$, (it) => it?.IsNegative)
  public readonly icon$ = this.select(this.effect$, (it) => it?.PlaceholderIcon || NW_FALLBACK_ICON)
  public readonly name$ = this.select(this.effect$, (it) => it?.DisplayName)
  public readonly nameForDisplay$ = this.select(this.effect$, (it) => it?.DisplayName || humanize(it?.StatusID))
  public readonly source$ = this.select(this.effect$, (it) => it?.['$source'])
  public readonly description$ = this.select(this.effect$, (it) => it?.Description)
  public readonly properties$ = this.select(this.effect$, selectProperties)
  public readonly onHitAffixId$ = this.select(this.effect$, (it) => it?.OnHitAffixes)
  public readonly affix$ = this.select(this.db.affixStat(this.onHitAffixId$), (it) => it)
  public readonly affixProps$ = this.select(this.affix$, selectAffixProperties)

  public readonly refEffects$ = this.select(this.effect$, selectStatusEffectReferences)

  public readonly refAbilities$ = this.select(this.effect$, (it) => {
    return uniq(flatten([it?.EquipAbility])).filter((e) => !!e)
  })

  public readonly foreignAbilities$ = combineLatest([
    this.db.abilitiesByStatusEffect(this.effectId$).pipe(map((it) => it || [])),
    this.db.abilitiesBySelfApplyStatusEffect(this.effectId$).pipe(map((it) => it || [])),
    this.db.abilitiesByOtherApplyStatusEffect(this.effectId$).pipe(map((it) => it || [])),
  ])
    .pipe(map(flatten))
    .pipe(mapList((it) => it.AbilityID))
    .pipe(map(uniq))

  public readonly foreignAffixStats$ = this.db
    .affixByStatusEffect(this.effectId$)
    .pipe(map((it) => it || []))
    .pipe(mapList((it) => it.StatusID))
    .pipe(map(uniq))

  public readonly foreignPerks$ = combineLatest({
    abilities: this.foreignAbilities$.pipe(switchMap((it) => perksByAbilities(it, this.db))),
    affixes: this.foreignAffixStats$.pipe(switchMap((it) => perksByAffix(it, this.db))),
  })
    .pipe(map(({ abilities, affixes }) => [...abilities, ...affixes]))
    .pipe(map(uniq))

  public readonly foreignItems$ = combineLatest([
    this.db
      .housingItemsByStatusEffect(this.effectId$)
      .pipe(map((it) => it || []))
      .pipe(mapList(getItemId)),
    this.db
      .consumablesByAddStatusEffects(this.effectId$)
      .pipe(map((it) => it || []))
      .pipe(mapList((it) => it.ConsumableID)),
  ]).pipe(map((list) => list.flat()))

  public readonly foreignDamageTables$ = combineLatest([
    this.db.damageTablesByStatusEffect(this.effectId$).pipe(map((it) => it || [])),
  ]).pipe(map((list) => list.flat()))

  public readonly costumeChangeId$ = this.select(this.effect$, (it) => it?.CostumeChangeId)
  public readonly costumeModel$ = inject(ModelsService).byCostumeId(this.costumeChangeId$)

  public constructor() {
    super({ effectId: null })
  }

  public load(idOrItem: string | StatusEffectData) {
    if (typeof idOrItem === 'string') {
      this.patchState({ effectId: idOrItem })
    } else {
      this.patchState({ effectId: idOrItem?.StatusID })
    }
  }
}

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
