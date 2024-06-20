import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON, explainPerkMods, getAffixMODs, getPerkItemClassGSBonus } from '@nw-data/common'
import { AffixStatData, PerkData } from '@nw-data/generated'
import { combineLatest, defer, map } from 'rxjs'
import { NwDataService } from '~/data'
import { NwTextContextService } from '~/nw/expression'
import { rejectKeys, selectStream } from '~/utils'

@Injectable()
export class PerkDetailStore extends ComponentStore<{ perkId: string }> {
  protected readonly context = inject(NwTextContextService)

  public readonly perkId$ = this.select(({ perkId }) => perkId)

  @Output()
  public readonly perk$ = this.select(this.db.perk(this.perkId$), (it) => it)

  public readonly textContext$ = selectStream(
    {
      perk: this.perk$,
      context: this.context.state$,
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
    }
  )

  public readonly textContextClass$ = selectStream(
    {
      perk: this.perk$,
      context: this.context.state$,
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
    }
  )

  public readonly scalesWithGearScore$ = this.select(this.perk$, (it) => !!it.ScalingPerGearScore)
  public readonly itemClassGsBonus$ = this.select(this.perk$, (it) => getPerkItemClassGSBonus(it))

  public readonly icon$ = this.select(this.perk$, (it) => it?.IconPath || NW_FALLBACK_ICON)
  public readonly type$ = this.select(this.perk$, (it) => it?.PerkType)
  public readonly name$ = this.select(this.perk$, (it) => it?.DisplayName || it?.SecondaryEffectDisplayName)
  public readonly description$ = this.select(this.perk$, (it) => it?.Description)
  public readonly properties$ = this.select(this.perk$, selectProperties)
  public readonly modsInfo$ = this.select(
    defer(() => this.affix$),
    (it) => getAffixMODs(it)
  )

  public readonly affixId$ = this.select(this.perk$, (it) => it?.Affix)
  public readonly affix$ = this.select(this.db.affixStat(this.affixId$), (it) => it)
  public readonly affixProps$ = this.select(this.affix$, selectAffixProperties)

  public readonly mods$ = this.select(
    combineLatest({
      perk: this.perk$,
      affix: this.affix$,
      abilities: this.db.abilitiesMap,
      context: this.textContext$,
    }),
    ({ perk, affix, abilities, context }) => {
      const mods = explainPerkMods({ perk, affix, gearScore: context.gearScore })
      if (!mods?.length) {
        return null
      }
      return mods
    }
  )

  public readonly refAbilities$ = this.perk$.pipe(map((it) => (it?.EquipAbility?.length ? it?.EquipAbility : null)))
  public readonly abilities$ = selectStream(
    {
      ref: this.refAbilities$,
      map: this.db.abilitiesMap,
    },
    ({ ref, map }) => {
      return ref?.map((id) => map.get(id)).filter((it) => !!it)
    },
    { debounce: true }
  )

  public readonly refEffects$ = selectStream(
    {
      affix: this.affix$,
      abilities: this.abilities$,
    },
    ({ affix, abilities }) => {
      const result: string[] = []
      if (affix?.StatusEffect) {
        result.push(affix.StatusEffect)
      }
      abilities?.forEach((it) => {
        if (it.SelfApplyStatusEffect?.length) {
          result.push(...it.SelfApplyStatusEffect)
        }
        if (it.OtherApplyStatusEffect?.length) {
          result.push(...it.OtherApplyStatusEffect)
        }
        it.StatusEffect
      })
      return result.length ? result : null
    }
  )

  public readonly resourceItems$ = selectStream(
    {
      perkId: this.perkId$,
      perkBuckets: this.db.perkBucketsByPerkIdMap,
      resources: this.db.resourcesByPerkBucketIdMap,
      items: this.db.itemsMap,
    },
    ({ perkId, perkBuckets, resources, items }) => {
      const buckets = perkBuckets.get(perkId)
      const resourcesList = buckets
        ?.map((it) => resources.get(it.PerkBucketID))
        .flat()
        .filter((it) => !!it)
      return resourcesList?.map((it) => items.get(it.ResourceID)).filter((it) => !!it)
    }
  )

  public constructor(private db: NwDataService) {
    super({ perkId: null })
  }

  public load(idOrItem: string | PerkData) {
    if (typeof idOrItem === 'string') {
      this.patchState({ perkId: idOrItem })
    } else {
      this.patchState({ perkId: idOrItem?.PerkID })
    }
  }
}

function selectProperties(item: PerkData) {
  const reject = ['$source', 'IconPath', 'DisplayName', 'Description']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}

function selectAffixProperties(item: AffixStatData) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
