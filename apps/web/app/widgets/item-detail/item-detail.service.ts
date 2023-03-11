import { ChangeDetectorRef, EventEmitter, Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { ItemDefinitionMaster, Perkbuckets, Perks } from '@nw-data/types'
import { sortBy } from 'lodash'
import { combineLatest, defer, map, switchMap } from 'rxjs'
import { NwDbService } from '~/nw'
import { AttributeRef } from '~/nw/attributes/nw-attributes'
import {
  getItemGearScoreLabel,
  getItemIconPath,
  getItemMaxGearScore,
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
import { humanize, mapProp, shareReplayRefCount, tapDebug } from '~/utils'
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

export interface ItemDetailState {
  entityId?: string
  gsOverride?: number
  gsEditable?: boolean
  perkOverride?: Record<string, string>
  perkEditable?: boolean
  attrValueSums?: Record<AttributeRef, number>
  playerLevel?: number
}

@Injectable()
export class ItemDetailStore extends ComponentStore<ItemDetailState> {
  public readonly entityId$ = this.select(({ entityId }) => entityId)
  public readonly gsOverride$ = this.select(({ gsOverride }) => gsOverride)
  public readonly gsEditable$ = this.select(({ gsEditable }) => gsEditable)
  public readonly perkOverride$ = this.select(({ perkOverride }) => perkOverride)
  public readonly perkEditable$ = this.select(({ perkEditable }) => perkEditable)
  public readonly attrValueSums$ = this.select(({ attrValueSums }) => attrValueSums)
  public readonly playerLevel$ = this.select(({ playerLevel }) => playerLevel)

  public readonly gsEdit$ = new EventEmitter<MouseEvent>()
  public readonly perkEdit$ = new EventEmitter<PerkDetail>()

  public readonly item$ = this.db.item(this.entityId$).pipe(shareReplayRefCount(1))
  public readonly housingItem$ = this.db.housingItem(this.entityId$).pipe(shareReplayRefCount(1))
  public readonly entity$ = this.select(this.item$, this.housingItem$, (item, housingItem) => item || housingItem)

  public readonly itemGS$ = this.select(this.item$, this.gsOverride$, (item, gs) => {
    return hasItemGearScore(item) ? gs || getItemMaxGearScore(item, false) : null
  })
  public readonly itemGSLabel$ = this.select(this.item$, this.gsOverride$, (item, gs) => {
    return hasItemGearScore(item) ? gs || getItemGearScoreLabel(item) : null
  })

  public readonly itemModels$ = this.entityId$.pipe(switchMap((id) => this.ms.getModelInfos(id)))
  public readonly itemStatsRef$ = this.select(this.item$, (it) => it?.ItemStatsRef)
  public readonly name$ = this.select(this.entity$, (it) => it?.Name)
  public readonly source$ = this.select(this.entity$, (it) => it?.['$source'] as string)
  public readonly sourceLabel$ = this.select(this.source$, humanize)
  public readonly description$ = this.select(this.entity$, (it) => it?.Description)
  public readonly icon$ = this.select(this.entity$, getItemIconPath)
  public readonly rarity$ = this.select(this.entity$, getItemRarity)
  public readonly rarityName$ = this.select(this.rarity$, getItemRarityLabel)
  public readonly typeName$ = this.select(this.entity$, getItemTypeName)
  public readonly tierLabel$ = this.select(this.entity$, (it) => getItemTierAsRoman(it?.Tier, true))
  public readonly isDeprecated$ = this.select(this.source$, (it) => /depricated/i.test(it || ''))
  public readonly isNamed$ = this.select(this.item$, (it) => it?.ItemClass?.includes('Named'))
  public readonly isRune$ = this.select(this.item$, (it) => !!it?.HeartgemTooltipBackgroundImage)
  public readonly isBindOnEquip = this.select(this.item$, (it) => !!it?.BindOnEquip)
  public readonly isBindOnPickup = this.select(this.entity$, (it) => !!it?.BindOnPickup)
  public readonly canReplaceGem = this.select(this.item$, (it) => it && it.CanHavePerks && it.CanReplaceGem)
  public readonly cantReplaceGem = this.select(this.item$, (it) => it && it.CanHavePerks && !it.CanReplaceGem)
  public readonly hasDescription$ = this.select(this.description$, isTruthy)
  public readonly hasStats$ = this.select(this.itemStatsRef$, isTruthy)
  public readonly salvageInfo$ = this.select(this.item$, (item) => {
    const recipe = item?.RepairRecipe
    if (!recipe?.startsWith('[LTID]')) {
      return null
    }
    return {
      tableId: recipe.replace('[LTID]', ''),
      tags: (item.SalvageLootTags || '').split(/[+,]/),
      tagValues: {
        MinContLevel: item.ContainerLevel,
        SalvageItemRarity: getItemRarity(item),
        SalvageItemTier: item.Tier,
      },
    }
  })
  public readonly hasPerks = combineLatest({
    item: this.item$,
    buckets: this.db.perkBucketsMap,
  }).pipe(map(({ item, buckets }) => item && (item.CanHavePerks || buckets.get(item.ItemID))))

  public readonly weaponStats$ = this.db.weapon(this.itemStatsRef$).pipe(shareReplayRefCount(1))
  public readonly armorStats$ = this.db.armor(this.itemStatsRef$).pipe(shareReplayRefCount(1))
  public readonly runeStats$ = this.db.rune(this.itemStatsRef$).pipe(shareReplayRefCount(1))
  public readonly ingredientCategories$ = this.select(this.db.recipeCategoriesMap, this.item$, (db, item) => {
    return item?.IngredientCategories?.map((it) => {
      return (
        db.get(it) || {
          CategoryID: it,
          DisplayText: it,
        }
      )
    })
  })

  public readonly perksDetails$ = defer(() => this.resolvePerkInfos()).pipe(shareReplayRefCount(1))
  public readonly gemDetail$ = this.perksDetails$.pipe(map((list) => list?.find((it) => it.perk?.PerkType === 'Gem')))
  public readonly finalRarity$ = defer(() => this.resolveFinalRarity())
  public readonly finalRarityName$ = this.finalRarity$.pipe(map(getItemRarityLabel))

  public readonly vmDescription$ = combineLatest({
    description: this.description$,
    runeImage: this.item$.pipe(mapProp('HeartgemTooltipBackgroundImage')),
    runeTitle: this.item$.pipe(mapProp('HeartgemRuneTooltipTitle')),
  }).pipe(shareReplayRefCount(1))

  public readonly vmInfo$ = combineLatest({
    bindOnEquip: this.isBindOnEquip,
    bindOnPickup: this.isBindOnPickup,
    tier: this.tierLabel$,
    canReplaceGem: this.canReplaceGem,
    cantReplaceGem: this.cantReplaceGem,
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
    attrValueSums: this.attrValueSums$,
    playerLevel: this.playerLevel$,
  }).pipe(
    map(({ item, weapon, rune, armor, gs, gsEditable, gsLabel, attrValueSums, playerLevel }) => {
      return {
        gsLabel: gsLabel,
        gsEditable: gsEditable,
        stats: [
          ...getItemStatsWeapon({
            item: item,
            stats: weapon || rune,
            gearScore: gs,
            attrValueSums: attrValueSums,
            playerLevel: playerLevel,
          }),
          ...getItemStatsArmor(item, armor, gs),
        ],
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
    super({})
  }

  public update(entityId: string) {
    this.patchState({ entityId })
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
