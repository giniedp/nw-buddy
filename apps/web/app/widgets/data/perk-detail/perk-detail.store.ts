import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON, explainPerkAttributeMods } from '@nw-data/common'
import { Affixstats, Perks } from '@nw-data/generated'
import { combineLatest, map } from 'rxjs'
import { NwDbService } from '~/nw'
import { NwExpressionContextService } from '~/nw/expression'
import { rejectKeys } from '~/utils'

@Injectable()
export class PerkDetailStore extends ComponentStore<{ perkId: string }> {
  protected readonly contextService = inject(NwExpressionContextService)

  public readonly perkId$ = this.select(({ perkId }) => perkId)

  @Output()
  public readonly perk$ = this.select(this.db.perk(this.perkId$), (it) => it)

  public readonly textContext$ = this.select(
    combineLatest({
      perk: this.perk$,
      context: this.contextService.value,
    }),
    ({ perk, context }) => {
      const result = {
        itemId: perk?.PerkID,
        gearScore: context.gs,
        level: context.level,
      }
      if (perk && perk.ItemClassGSBonus && context.gsBonus) {
        result.gearScore += Number(perk.ItemClassGSBonus.split(',')[0].split(':')[1]) || 0
      }
      return result
    }
  )

  public readonly icon$ = this.select(this.perk$, (it) => it?.IconPath || NW_FALLBACK_ICON)
  public readonly type$ = this.select(this.perk$, (it) => it?.PerkType)
  public readonly name$ = this.select(this.perk$, (it) => it?.DisplayName || it?.SecondaryEffectDisplayName)
  public readonly description$ = this.select(this.perk$, (it) => it?.Description)
  public readonly properties$ = this.select(this.perk$, selectProperties)

  public readonly affixId$ = this.select(this.perk$, (it) => it?.Affix)
  public readonly affix$ = this.select(this.db.affixstat(this.affixId$), (it) => it)
  public readonly affixProps$ = this.select(this.affix$, selectAffixProperties)

  public readonly mods$ = this.select(
    combineLatest({
      perk: this.perk$,
      affix: this.affix$,
      abilities: this.db.abilitiesMap,
      context: this.textContext$,
    }),
    ({ perk, affix, abilities, context }) => {
      const mods = explainPerkAttributeMods({ perk, affix, gearScore: context.gearScore })
      if (!mods?.length) {
        return null
      }
      return mods
    }
  )

  public readonly refAbilities$ = this.perk$.pipe(map((it) => (it?.EquipAbility?.length ? it?.EquipAbility : null)))
  public readonly refEffects$ = this.affix$.pipe(map((it) => (it?.StatusEffect ? [it.StatusEffect] : null)))

  public constructor(private db: NwDbService) {
    super({ perkId: null })
  }

  public load(idOrItem: string | Perks) {
    if (typeof idOrItem === 'string') {
      this.patchState({ perkId: idOrItem })
    } else {
      this.patchState({ perkId: idOrItem?.PerkID })
    }
  }
}

function selectProperties(item: Perks) {
  const reject = ['$source', 'IconPath', 'DisplayName', 'Description']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}

function selectAffixProperties(item: Affixstats) {
  const reject = ['$source']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
