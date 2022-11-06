import { ChangeDetectorRef, Injectable } from '@angular/core'
import { ItemDefinitionMaster, Perkbuckets, Perks } from '@nw-data/types'
import { sortBy } from 'lodash'
import { BehaviorSubject, combineLatest, defer, map, ReplaySubject, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import {
  getItemGearScoreLabel,
  getItemIconPath,
  getItemMaxGearScore,
  getItemMinGearScore,
  getItemPerkBucketKeys,
  getItemPerkKeys,
  getItemRarity,
  getItemRarityName,
  getItemTierAsRoman,
  getItemTypeName,
  getPerkbucketPerks,
  getPerksInherentMODs,
  getPerkTypeWeight,
  hasPerkInherentAffix
} from '~/nw/utils'
import { deferStateFlat, humanize, shareReplayRefCount } from '~/utils'

function isTruthy(value: any) {
  return !!value
}
function isFalsy(value: any) {
  return !value
}

export interface PerkDetail {
  item: ItemDefinitionMaster
  key: string
  editable?: boolean
  bucket?: Perkbuckets
  perk?: Perks
  icon?: string
  text?: Array<{ label: string; description: string }>
}

@Injectable()
export class ItemDetailService {
  public readonly item$ = defer(() => this.db.item(this.entityId$)).pipe(shareReplayRefCount(1))
  public readonly itemGS$ = defer(() => combineLatest([this.item$, this.gearScoreOverride$]))
    .pipe(map(([item, gs]) => gs || getItemMaxGearScore(item)))
    .pipe(shareReplayRefCount(1))
  public readonly itemGSLabel$ = defer(() => combineLatest([this.item$, this.gearScoreOverride$]))
    .pipe(map(([item, gs]) => gs || getItemGearScoreLabel(item)))
    .pipe(shareReplayRefCount(1))
  public readonly itemGSMin$ = defer(() => combineLatest([this.item$, this.gearScoreOverride$]))
    .pipe(map(([item, gs]) => gs || getItemMinGearScore(item)))
    .pipe(shareReplayRefCount(1))

  public readonly housingItem$ = defer(() => this.db.housingItem(this.entityId$)).pipe(shareReplayRefCount(1))
  public readonly entity$ = defer(() => combineLatest([this.item$, this.housingItem$]))
    .pipe(map(([item, housing]) => item || housing))
    .pipe(shareReplayRefCount(1))

  public readonly itemStatsRef$ = this.item$.pipe(map((it) => it?.ItemStatsRef))
  public readonly entityId$ = new ReplaySubject<string>(1)
  public readonly name$ = this.entity$.pipe(map((it) => it?.Name))
  public readonly source$ = this.entity$.pipe(map((it) => it?.['$source']))
  public readonly description$ = this.entity$.pipe(map((it) => it?.Description))
  public readonly icon$ = this.entity$.pipe(map((it) => getItemIconPath(it)))
  public readonly rarity$ = this.entity$.pipe(map((it) => getItemRarity(it)))
  public readonly rarityName$ = this.rarity$.pipe(map(getItemRarityName))
  public readonly typeName$ = this.entity$.pipe(map(getItemTypeName))
  public readonly tierLabel$ = this.entity$.pipe(map((it) => getItemTierAsRoman(it?.Tier, true)))

  public readonly weaponStats$ = this.db.weapon(this.itemStatsRef$)
  public readonly armorStats$ = this.db.armor(this.itemStatsRef$)
  public readonly runeStats$ = this.db.rune(this.itemStatsRef$)
  public readonly ingredientCategories$ = combineLatest({
    categories: this.db.recipeCategoriesMap,
    item: this.item$,
  }).pipe(
    map(({ categories, item }) =>
      item?.IngredientCategories?.map((it) => {
        return (
          categories.get(it) || {
            CategoryID: it,
            DisplayText: it,
          }
        )
      })
    )
  )

  public readonly gearScoreOverride$ = new BehaviorSubject<number>(null)
  public readonly perkOverride$ = new BehaviorSubject<Record<string, string>>(null)

  public readonly perksDetails$ = defer(() => this.resolvePerkInfos()).pipe(shareReplayRefCount(1))
  public readonly finalRarity$ = defer(() => this.resolveFinalRarity())
  public readonly finalRarityName$ = this.finalRarity$.pipe(map(getItemRarityName))

  public readonly vm$ = deferStateFlat(() =>
    combineLatest({
      item: this.item$,
      housingItem: this.housingItem$,
      entity: this.entity$,
      entityId: this.entityId$,
      name: this.name$,
      sourceLabel: this.source$.pipe(map((it) => humanize(it))),
      isDeprecated: this.source$.pipe(map((it) => /depricated/i.test(it || ''))),
      isNamed: this.item$.pipe(map((it) => it?.ItemClass?.includes('Named'))),
      description: this.description$,
      icon: this.icon$,
      rarity: this.finalRarity$,
      rarityName: this.finalRarityName$,
      typeName: this.typeName$,
      isRune: this.item$.pipe(map((it) => it && !!it.HeartgemTooltipBackgroundImage)),
      hasDescription: this.description$.pipe(map(isTruthy)),
      hasStats: this.itemStatsRef$.pipe(map(isTruthy)),
      hasPerks: combineLatest({
        item: this.item$,
        buckets: this.db.perkBucketsMap,
      }).pipe(map(({ item, buckets }) => item && (item.CanHavePerks || buckets.get(item.ItemID)))),
    })
  ).pipe(shareReplayRefCount(1))

  public constructor(protected db: NwDbService, protected cdRef: ChangeDetectorRef) {
    //
  }

  public update(entityId: string) {
    this.entityId$.next(entityId)
  }

  private resolveFinalRarity() {
    return this.perkOverride$.pipe(
      switchMap((it) => {
        if (!it) {
          return this.rarity$
        }
        return combineLatest({
          item: this.item$,
          perks: this.perksDetails$,
        }).pipe(
          map(({ item, perks }) => {
            const perkIds = perks
              .map((it) => it.perk)
              .filter((it) => !!it)
              .map((it) => it.PerkID)
            return getItemRarity(item, perkIds)
          })
        )
      })
    )
  }
  private resolvePerkInfos() {
    const perks$ = combineLatest({
      item: this.item$,
      perks: this.db.perksMap,
      buckets: this.db.perkBucketsMap,
      override: this.perkOverride$,
    }).pipe(
      map(({ item, perks, buckets, override }): PerkDetail[] => {
        const result = getItemPerkKeys(item).map((key) => {
          const perkId = item[key]
          const overrideId = override?.[key]
          const perk = perks.get(overrideId || perkId)
          return {
            item: item,
            key: key,
            perk: perk,
            editable: item.CanReplaceGem && perk?.PerkType === 'Gem',
          }
        })
        const bucket = buckets.get(item?.ItemID)
        if (bucket) {
          getPerkbucketPerks(bucket, perks)?.forEach((perk, i) => {
            result.push({
              item: item,
              editable: false,
              perk: perk,
              key: `${bucket.PerkBucketID}-${i}`,
            })
          })
        }
        return result
      })
    )

    const buckets$ = combineLatest({
      item: this.item$,
      perks: this.db.perksMap,
      buckets: this.db.perkBucketsMap,
      override: this.perkOverride$,
    }).pipe(
      map(({ item, perks, buckets, override }): PerkDetail[] => {
        const result = getItemPerkBucketKeys(item).map((key) => ({
          item: item,
          key: key,
          perk: perks.get(override?.[key]),
          bucket: buckets.get(item[key]),
          editable: true,
        }))
        return result
      })
    )

    return combineLatest({
      infos: combineLatest([perks$, buckets$])
        .pipe(map(([a, b]) => [...a, ...b]))
        .pipe(map((list) => sortBy(list, (it) => getPerkTypeWeight((it.perk || it.bucket)?.PerkType)))),
      affix: this.db.affixstatsMap,
      gearScore: this.itemGS$,
    }).pipe(
      map(({ infos, affix, gearScore }) => {
        for (const detail of infos) {
          const perk = detail.perk
          detail.text = []
          detail.icon = perk?.IconPath
          if (hasPerkInherentAffix(perk)) {
            getPerksInherentMODs(perk, affix.get(perk.Affix), gearScore)?.forEach((mod) => {
              detail.text.push({
                label: String(mod.value),
                description: mod.label,
              })
            })
          } else if (perk) {
            detail.text.push({
              label: perk.AppliedPrefix || perk.DisplayName || perk.AppliedSuffix,
              description: perk.Description,
            })
          }
        }
        return infos
      })
    )
  }
}
