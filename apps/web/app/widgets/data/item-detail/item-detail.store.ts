import { ChangeDetectorRef, EventEmitter, Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import {
  AttributeRef,
  NW_FALLBACK_ICON,
  NW_MAX_CHARACTER_LEVEL,
  getFirstItemClassOf,
  getItemAttribution,
  getItemExpansion,
  getItemGsBonus,
  getItemIconPath,
  getItemIdFromRecipe,
  getItemPerkBucketIds,
  getItemRarity,
  getItemRarityLabel,
  getItemSetFamilyName,
  getItemSourceShort,
  getItemStatsArmor,
  getItemStatsWeapon,
  getItemTierAsRoman,
  getItemTypeName,
  getItemVersionString,
  isItemArtifact,
  isItemHeartGem,
  isItemNamed,
  isPerkGem,
} from '@nw-data/common'
import { MasterItemDefinitions } from '@nw-data/generated'
import { uniq } from 'lodash'
import { combineLatest, map, of, switchMap } from 'rxjs'
import { NwDataService } from '~/data'
import { humanize, mapProp, selectStream } from '~/utils'
import { ModelsService } from '../../model-viewer/model-viewer.service'
import { selectGameEventItemReward, selectGameEventRewards } from '../game-event-detail/selectors'
import {
  PerkSlot,
  selectCraftingCategories,
  selectDescription,
  selectFinalRarity,
  selectItemGearscore,
  selectItemGearscoreLabel,
  selectNamePerfix,
  selectNameSuffix,
  selectPerkSlots,
  selectResourcePerkIds,
  selectSalvageInfo,
  selectStatusEffectIds,
} from './selectors'

export interface ItemDetailState {
  recordId?: string
  gsOverride?: number
  gsEditable?: boolean
  perkOverride?: Record<string, string>
  perkEditable?: boolean
  attrValueSums?: Record<AttributeRef, number>
  playerLevel?: number
}

@Injectable()
export class ItemDetailStore extends ComponentStore<ItemDetailState> {
  public readonly recordId$ = this.select(({ recordId }) => recordId)
  public readonly gsOverride$ = this.select(({ gsOverride }) => gsOverride)
  public readonly gsEditable$ = this.select(({ gsEditable }) => gsEditable)
  public readonly perkOverride$ = this.select(({ perkOverride }) => perkOverride)
  public readonly perkEditable$ = this.select(({ perkEditable }) => perkEditable)
  public readonly attrValueSums$ = this.select(({ attrValueSums }) => attrValueSums)
  public readonly playerLevel$ = selectStream(
    {
      playerLevel: of(null),
      overrideLevel: this.select(({ playerLevel }) => playerLevel),
    },
    ({ playerLevel, overrideLevel }) => overrideLevel || playerLevel || NW_MAX_CHARACTER_LEVEL,
  )

  public readonly gsEdit$ = new EventEmitter<MouseEvent>()
  public readonly perkEdit$ = new EventEmitter<PerkSlot>()

  public readonly transformToId$ = this.select(this.db.itemTransform(this.recordId$), (it) => it?.ToItemId)
  public readonly transformFromIds$ = this.select(this.db.itemTransformsByToItemId(this.recordId$), (it) => {
    return !it ? null : Array.from(it).map((it) => it.FromItemId)
  })

  public readonly item$ = this.select(this.db.item(this.recordId$), (it) => it)
  public readonly housingItem$ = this.select(this.db.housingItem(this.recordId$), (it) => it)
  public readonly consumable$ = this.select(this.db.consumable(this.recordId$), (it) => it)
  public readonly resource$ = this.select(this.db.resource(this.recordId$), (it) => it)
  public readonly resourcePerkIds$ = this.select(this.db.perkBucketsMap, this.resource$, selectResourcePerkIds)
  public readonly perkBucketIds$ = this.select(this.item$, (item) => getItemPerkBucketIds(item))
  public readonly entity$ = this.select(this.item$, this.housingItem$, (item, housingItem) => item || housingItem)
  public readonly salvageGameEventId$ = this.select(this.item$, (it) => it?.SalvageGameEventID)
  public readonly salvageGameEvent$ = selectStream(this.db.gameEvent(this.salvageGameEventId$))
  public readonly salvageGameEventItemReward$ = selectStream(this.salvageGameEvent$, (it) =>
    selectGameEventItemReward(it),
  )
  public readonly salvageGameEventRewardItemId$ = selectStream(
    this.salvageGameEventItemReward$,
    (it) => it?.housingItemId || it?.itemId,
  )
  public readonly salvageGameEventRewardItem$ = selectStream(
    this.db.itemOrHousingItem(this.salvageGameEventRewardItemId$),
  )
  public readonly salvageGameEventRewards$ = selectStream(
    {
      item: this.salvageGameEventRewardItem$,
      event: this.salvageGameEvent$,
    },
    ({ event, item }) => selectGameEventRewards(event, item),
  )
  public readonly salvageAchievementId$ = this.select(this.item$, (it) => it?.SalvageAchievement)
  public readonly salvageAchievementRecipe$ = selectStream(this.db.recipeByAchievementId(this.salvageAchievementId$))
  public readonly dropTableIds$ = selectStream(
    {
      tablesByBycketMap: this.db.lootTablesByLootBucketIdMap,
      tables: this.db.lootTablesByLootItemId(this.recordId$),
      buckets: this.db.lootBucketsByItemId(this.recordId$),
    },
    ({ tablesByBycketMap, tables, buckets }) => {
      const result: string[] = []
      for (const table of tables || []) {
        result.push(table.LootTableID)
      }
      for (const bucket of buckets || []) {
        for (const table of tablesByBycketMap?.get(bucket.LootBucket) || []) {
          if (table) {
            result.push(table.LootTableID)
          }
        }
      }
      return uniq(result)
    },
  )

  public readonly itemGS$ = this.select(this.item$, this.gsOverride$, selectItemGearscore)
  public readonly itemGSLabel$ = this.select(this.item$, this.gsOverride$, selectItemGearscoreLabel)
  public readonly craftableRecipes$ = this.select(this.db.recipesByIngredientId(this.recordId$), (it) => {
    if (!it) {
      return null
    }
    return Array.from(it.values())
      .map((recipe) => {
        return {
          recipe,
          itemId: getItemIdFromRecipe(recipe),
        }
      })
      .filter((it) => !!it.itemId)
  })
  public readonly recipes$ = this.select(this.db.recipesByItemId(this.recordId$), (it) => {
    if (!it) {
      return null
    }
    return Array.from(it.values())
      .map((recipe) => {
        return {
          recipe,
          itemId: getItemIdFromRecipe(recipe),
        }
      })
      .filter((it) => !!it.itemId)
  })

  public readonly perkSlots$ = selectStream(
    {
      item: this.item$,
      itemGS: this.itemGS$,
      perks: this.db.perksMap,
      buckets: this.db.perkBucketsMap,
      affixes: this.db.affixStatsMap,
      abilities: this.db.abilitiesMap,
      perkOverride: this.perkOverride$,
    },
    (it) => {
      return selectPerkSlots({
        item: it.item,
        itemGS: it.itemGS,
        perks: it.perks,
        buckets: it.buckets,
        affixes: it.affixes,
        abilities: it.abilities,
        perkOverride: it.perkOverride,
      })
    },
  )

  public readonly itemModels$ = this.ms.byItemId(this.recordId$)
  public readonly itemStatsRef$ = this.select(this.item$, (it) => it?.ItemStatsRef)
  public readonly attribution$ = this.select(this.entity$, (it) => getItemAttribution(it))
  public readonly expansion$ = this.select(this.item$, (it) => getItemExpansion(it?.RequiredExpansionId))

  public readonly weaponStats$ = this.select(this.db.weapon(this.itemStatsRef$), (it) => it)
  public readonly armorStats$ = this.select(this.db.armor(this.itemStatsRef$), (it) => it)
  public readonly runeStats$ = this.select(this.db.rune(this.itemStatsRef$), (it) => it)

  public readonly name$ = this.select(this.entity$, (it) => it?.Name)
  public readonly namePrefix$ = this.select(this.item$, this.perkSlots$, selectNamePerfix)
  public readonly nameSuffix$ = this.select(this.item$, this.perkSlots$, selectNameSuffix)
  public readonly source$ = this.select(this.entity$, (it) => getItemSourceShort(it) as string)
  public readonly sourceLabel$ = this.select(this.source$, humanize)
  public readonly description$ = this.select(this.entity$, selectDescription)
  public readonly icon$ = this.select(this.entity$, (it) => getItemIconPath(it) || NW_FALLBACK_ICON)
  public readonly rarity$ = this.select(this.entity$, getItemRarity)
  public readonly rarityName$ = this.select(this.rarity$, getItemRarityLabel)
  public readonly typeName$ = this.select(this.entity$, getItemTypeName)
  public readonly tierLabel$ = this.select(this.entity$, (it) => getItemTierAsRoman(it?.Tier, true))
  public readonly isDeprecated$ = this.select(this.source$, (it) => /depricated/i.test(it || ''))
  public readonly isNamed$ = this.select(this.item$, isItemNamed)
  public readonly isArtifact$ = this.select(this.item$, isItemArtifact)
  public readonly isRune$ = this.select(this.item$, isItemHeartGem)
  public readonly isBindOnEquip$ = this.select(this.item$, (it) => !!it?.BindOnEquip)
  public readonly isBindOnPickup$ = this.select(this.entity$, (it) => !!it?.BindOnPickup)
  public readonly isMissing$ = this.select(this.recordId$, this.entity$, (id, record) => !record && !!id)
  public readonly canReplaceGem$ = this.select(this.item$, (it) => it && it.CanHavePerks && it.CanReplaceGem)
  public readonly cantReplaceGem$ = this.select(this.item$, (it) => it && it.CanHavePerks && !it.CanReplaceGem)
  public readonly salvageInfo$ = selectStream(
    {
      entity: this.entity$,
      playerLevel: this.playerLevel$,
    },
    ({ entity, playerLevel }) => selectSalvageInfo(entity, playerLevel),
  )
  public readonly appearanceM$ = this.select(
    this.db.itemAppearance(this.item$.pipe(mapProp('ArmorAppearanceM'))),
    (it) => it,
  )
  public readonly appearanceF$ = this.select(
    this.db.itemAppearance(this.item$.pipe(mapProp('ArmorAppearanceF'))),
    (it) => it,
  )
  public readonly weaponAppearance$ = this.select(
    this.db.weaponAppearance(this.item$.pipe(mapProp('WeaponAppearanceOverride'))),
    (it) => it,
  )
  public readonly instrumentAppearance$ = this.select(
    this.db.instrumentAppearance(this.item$.pipe(mapProp('WeaponAppearanceOverride'))),
    (it) => it,
  )
  public readonly ingredientCategories$ = this.select(this.db.recipeCategoriesMap, this.item$, selectCraftingCategories)
  public readonly statusEffectsIds$ = this.select(this.consumable$, this.housingItem$, selectStatusEffectIds)
  public readonly gemDetail$ = this.select(this.perkSlots$, (list) => list?.find((it) => isPerkGem(it.perk)))
  public readonly finalRarity$ = this.select(
    combineLatest({
      item: this.entity$,
      perkDetails: this.perkSlots$,
      perkOverride: this.perkOverride$,
    }),
    selectFinalRarity,
  )
  public readonly finalRarityName$ = this.select(this.isArtifact$, this.finalRarity$, (isArtifact, rarity) => {
    return getItemRarityLabel(rarity)
  })

  public readonly itemSetName$ = this.select(this.item$, (it) => getItemSetFamilyName(it))
  public readonly itemSet$ = this.select(this.item$, this.db.itemSet(this.itemSetName$), selectItemSet)

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
    }),
  )

  public readonly vmPerks$ = selectStream(
    {
      item: this.item$,
      gearScore: this.itemGS$,
      editable: this.perkEditable$,
      details: this.perkSlots$,
    },
    ({ item, gearScore, editable, details }) => {
      return details.map((detail) => {
        return {
          detail: detail,
          perk: detail?.perk,
          gs: gearScore + getItemGsBonus(detail?.perk, item),
          editable: editable && detail?.editable,
        }
      })
    },
  )

  public readonly artifactPerkTasks$ = this.item$.pipe(
    switchMap((it) => {
      if (isItemArtifact(it)) {
        return collectArtifactTasks(it, this.db)
      }
      return of(null)
    }),
  )

  public constructor(
    protected db: NwDataService,
    private ms: ModelsService,
  ) {
    super({})
  }

  public update(entityId: string) {
    this.patchState({ recordId: entityId })
  }
}

function collectArtifactTasks(item: MasterItemDefinitions, db: NwDataService) {
  return db.objectiveTasksMap.pipe(
    map((tasks) => {
      const task = tasks.get(`Task_ContainerPerks_${item.ItemID}`)
      if (!task) {
        return null
      }
      return {
        task: task,
        perk1: tasks.get(task.SubTask1),
        perk2: tasks.get(task.SubTask2),
        perk3: tasks.get(task.SubTask3),
        perk4: tasks.get(task.SubTask4),
      }
    }),
  )
}
export interface ItemCollections {
  items?: MasterItemDefinitions[]
  tiers?: MasterItemDefinitions[]
  variants?: MasterItemDefinitions[]
}

function selectItemSet(item: MasterItemDefinitions, itemsSet: MasterItemDefinitions[]): ItemCollections {
  if (!item || !itemsSet) {
    return null
  }

  // console.log({
  //   item,
  //   itemsSet: Array.from(itemsSet?.values()),
  // })

  const meta = getItemMeta(item)
  const items = itemsSet.map(getItemMeta).filter((it) => !!it)

  // console.log({ items })
  if (!meta?.mainCategory) {
    return null
  }

  if (meta.mainCategory === 'Resource') {
    return {
      tiers: items.filter((it) => it.mainCategory === meta.mainCategory).map((it) => it.item),
    }
  }

  const itemSet = items.filter((it) => {
    return (
      it.subCategory === meta.subCategory &&
      it.version === meta.version &&
      it.tier === meta.tier &&
      it.rarity === meta.rarity
    )
  })
  const tierVariants = items.filter((it) => {
    return (
      it.mainCategory === meta.mainCategory &&
      it.subCategory === meta.subCategory &&
      it.version === meta.version &&
      it.rarity === meta.rarity
    )
  })
  const variants = items.filter((it) => {
    return it.mainCategory === meta.mainCategory && it.subCategory === meta.subCategory && it.tier === meta.tier
  })

  // console.log({ gearset, tierVariants, variants })
  if (itemSet.length === 1 && tierVariants.length === 1 && variants.length === 1) {
    return null
  }
  return {
    items: itemSet.map((it) => it.item),
    tiers: tierVariants.map((it) => it.item),
    variants: variants.map((it) => it.item),
  }
}

function getItemMeta(item: MasterItemDefinitions) {
  const armorClass = getFirstItemClassOf(item, [
    'EquippableChest',
    'EquippableFeet',
    'EquippableHands',
    'EquippableHead',
    'EquippableLegs',
  ])
  if (armorClass) {
    return {
      item: item,
      version: getItemVersionString(item),
      tier: item.Tier,
      rarity: getItemRarity(item),
      subCategory: getFirstItemClassOf(item, ['Light', 'Medium', 'Heavy']),
      mainCategory: armorClass,
    }
  }
  const weaponClass = getFirstItemClassOf(item, ['EquippableMainHand', 'EquippableTwoHand', 'EquippableOffHand'])
  if (weaponClass) {
    return {
      item: item,
      version: getItemVersionString(item),
      tier: item.Tier,
      rarity: getItemRarity(item),
      subCategory: 'weapon',
      mainCategory: getFirstItemClassOf(item, [
        '2HAxe',
        '2HHammer',
        'Axe',
        'Blunderbuss',
        'Bow',
        'FireStaff',
        'Flail',
        'GreatSword',
        'Hatchet',
        'IceMagic',
        'KiteShield',
        'LifeStaff',
        'Musket',
        'Rapier',
        'RoundShield',
        'Spear',
        'Sword',
        'TowerShield',
        'VoidGauntlet',
      ]),
    }
  }
  const jevleryClass = getFirstItemClassOf(item, ['EquippableAmulet', 'EquippableRing', 'EquippableToken'])
  if (jevleryClass) {
    return {
      item: item,
      version: getItemVersionString(item),
      tier: item.Tier,
      rarity: getItemRarity(item),
      subCategory: 'jevlery',
      mainCategory: jevleryClass,
    }
  }
  const resourceClass = getFirstItemClassOf(item, ['Resource'])
  if (resourceClass) {
    return {
      item: item,
      version: getItemVersionString(item),
      tier: item.Tier,
      rarity: getItemRarity(item),
      subCategory: resourceClass,
      mainCategory: resourceClass,
    }
  }
  return null
}
