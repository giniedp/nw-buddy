import { ChangeDetectorRef, EventEmitter, Injectable, Output } from '@angular/core'
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
  getItemRarityLabel,
  getItemStatsArmor,
  getItemStatsWeapon,
  getItemTierAsRoman,
  getItemTypeName,
  getPerkbucketPerks,
  getPerksInherentMODs,
  getPerkTypeWeight,
  hasItemGearScore,
  hasPerkInherentAffix,
} from '~/nw/utils'
import { deferStateFlat, humanize, mapProp, mapPropTruthy, shareReplayRefCount } from '~/utils'
import { ModelViewerService } from '../model-viewer/model-viewer.service'

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
  public readonly entityId$ = new ReplaySubject<string>(1)
  public readonly gsOverride$ = new BehaviorSubject<number>(null)
  public readonly gsEditable$ = new BehaviorSubject<boolean>(false)
  public readonly gsEdit$ = new EventEmitter<MouseEvent>()
  public readonly perkOverride$ = new BehaviorSubject<Record<string, string>>(null)
  public readonly perkEditable$ = new BehaviorSubject<boolean>(false)
  public readonly perkEdit$ = new EventEmitter<PerkDetail>()

  public readonly item$ = this.db.item(this.entityId$).pipe(shareReplayRefCount(1))
  public readonly housingItem$ = this.db.housingItem(this.entityId$).pipe(shareReplayRefCount(1))
  public readonly entity$ = combineLatest([this.item$, this.housingItem$])
    .pipe(map(([item, housing]) => item || housing))
    .pipe(shareReplayRefCount(1))

  public readonly itemGS$ = combineLatest([this.item$, this.gsOverride$])
    .pipe(map(([item, gs]) => (hasItemGearScore(item) ? gs || getItemMaxGearScore(item, false) : null)))
    .pipe(shareReplayRefCount(1))
  public readonly itemGSLabel$ = combineLatest([this.item$, this.gsOverride$])
    .pipe(map(([item, gs]) => (hasItemGearScore(item) ? gs || getItemGearScoreLabel(item) : null)))
    .pipe(shareReplayRefCount(1))

  public readonly itemModels$ = this.entityId$.pipe(switchMap((id) => this.ms.getModelInfos(id)))
  public readonly itemStatsRef$ = this.item$.pipe(map((it) => it?.ItemStatsRef))
  public readonly name$ = this.entity$.pipe(map((it) => it?.Name))
  public readonly source$ = this.entity$.pipe(map((it) => it?.['$source'] as string))
  public readonly sourceLabel$ = this.source$.pipe(map(humanize))
  public readonly description$ = this.entity$.pipe(map((it) => it?.Description))
  public readonly icon$ = this.entity$.pipe(map((it) => getItemIconPath(it)))
  public readonly rarity$ = this.entity$.pipe(map((it) => getItemRarity(it)))
  public readonly rarityName$ = this.rarity$.pipe(map(getItemRarityLabel))
  public readonly typeName$ = this.entity$.pipe(map(getItemTypeName))
  public readonly tierLabel$ = this.entity$.pipe(map((it) => getItemTierAsRoman(it?.Tier, true)))
  public readonly isDeprecated$ = this.source$.pipe(map((it) => /depricated/i.test(it || '')))
  public readonly isNamed$ = this.item$.pipe(map((it) => it?.ItemClass?.includes('Named')))
  public readonly isRune$ = this.item$.pipe(map((it) => !!it?.HeartgemTooltipBackgroundImage))
  public readonly hasDescription$ = this.description$.pipe(map(isTruthy))
  public readonly hasStats$ = this.itemStatsRef$.pipe(map(isTruthy))
  public readonly hasPerks = combineLatest({
    item: this.item$,
    buckets: this.db.perkBucketsMap,
  }).pipe(map(({ item, buckets }) => item && (item.CanHavePerks || buckets.get(item.ItemID))))

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

  public readonly perksDetails$ = defer(() => this.resolvePerkInfos()).pipe(shareReplayRefCount(1))
  public readonly finalRarity$ = defer(() => this.resolveFinalRarity())
  public readonly finalRarityName$ = this.finalRarity$.pipe(map(getItemRarityLabel))

  public readonly vmDescription$ = combineLatest({
    description: this.description$,
    runeImage: this.item$.pipe(mapProp('HeartgemTooltipBackgroundImage')),
    runeTitle: this.item$.pipe(mapProp('HeartgemRuneTooltipTitle')),
  }).pipe(shareReplayRefCount(1))

  public readonly vmInfo$ = combineLatest({
    bindOnEquip: this.item$.pipe(mapPropTruthy('BindOnEquip')),
    bindOnPickup: this.entity$.pipe(mapPropTruthy('BindOnPickup')),
    tier: this.tierLabel$,
    canReplaceGem: this.item$.pipe(map((it) => it && it.CanHavePerks && it.CanReplaceGem)),
    cantReplaceGem: this.item$.pipe(map((it) => it && it.CanHavePerks && !it.CanReplaceGem)),
    weight: combineLatest({
      weapon: this.weaponStats$,
      armor: this.armorStats$,
      item: this.item$,
    }).pipe(map(({ weapon, armor, item }) => (weapon?.WeightOverride || armor?.WeightOverride || item?.Weight) / 10)),
    durability: this.item$.pipe(mapProp('Durability')),
    maxStackSize: this.entity$.pipe(mapProp('MaxStackSize')),
    requiredLevel: this.item$.pipe(mapProp('RequiredLevel')),
    ingredientTypes: this.ingredientCategories$,
  }).pipe(shareReplayRefCount(1))

  public readonly vmStats$ = combineLatest({
    item: this.item$,
    weapon: this.weaponStats$,
    armor: this.armorStats$,
    rune: this.runeStats$,
    gs: this.itemGS$,
    gsEditable: this.gsEditable$,
    gsLabel: this.itemGSLabel$,
  }).pipe(
    map(({ item, weapon, rune, armor, gs, gsEditable, gsLabel }) => {
      return {
        gsLabel: gsLabel,
        gsEditable: gsEditable,
        stats: [...getItemStatsWeapon(item, weapon || rune, gs), ...getItemStatsArmor(item, armor, gs)],
      }
    })
  )

  public readonly vmPerks$ = combineLatest({
    gs: this.itemGS$,
    editable: this.perkEditable$,
    details: this.perksDetails$,
  }).pipe(
    map(({ gs, editable, details }) => {
      return details.map((detail) => {
        return {
          detail: detail,
          perk: detail?.perk,
          gs,
          editable: editable && detail?.editable,
        }
      })
    })
  )

  public constructor(protected db: NwDbService, private ms: ModelViewerService, protected cdRef: ChangeDetectorRef) {
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
              label: perk.DisplayName || perk.AppliedPrefix || perk.AppliedSuffix,
              description: perk.Description,
            })
          }
        }
        return infos
      })
    )
  }
}
