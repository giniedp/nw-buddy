import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  resource,
  ResourceRef,
  Signal,
  untracked,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterModule } from '@angular/router'
import {
  getItemId,
  getItemIdFromRecipe,
  getItemPerkBucketIds,
  getPerkBucketPerkIDs,
  isHousingItem,
  isMasterItem,
  itemSalvageContext,
  itemSalvageLootTable,
} from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { uniq } from 'lodash'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { PaginationModule } from '~/ui/pagination'
import { TabsModule } from '~/ui/tabs'
import { eqCaseInsensitive, observeQueryParam } from '~/utils'
import { CraftingCalculatorComponent } from '~/widgets/crafting'
import { AppearanceDetailModule } from '~/widgets/data/appearance-detail'
import { EntitlementDetailModule } from '~/widgets/data/entitlement-detail'
import { ItemDetailModule, ItemDetailStore } from '~/widgets/data/item-detail'
import { PerkBucketDetailComponent } from '~/widgets/data/perk-bucket-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { LootGraphComponent } from '~/widgets/loot/loot-graph.component'
import { VitalDetailModule } from '../../../widgets/data/vital-detail'
import { LootContextEditorComponent } from "~/widgets/loot";

export type ItemTabId =
  | 'effects'
  | 'perks'
  | 'unlocks'
  | 'craftable'
  | 'recipes'
  | 'transmog'
  | 'gearset'
  | 'loot'
  | 'rewards'
  | 'dropped-by'
  | 'salvaged-from'
  | 'salvages-to'
export interface ItemTab {
  id: ItemTabId
  label: string
}

@Component({
  selector: 'nwb-item-page-tabs',
  templateUrl: './item-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    RouterModule,
    ItemDetailModule,
    StatusEffectDetailModule,
    PerkDetailModule,
    CraftingCalculatorComponent,
    PaginationModule,
    PerkBucketDetailComponent,
    AppearanceDetailModule,
    LootGraphComponent,
    TabsModule,
    EntitlementDetailModule,
    VitalDetailModule,
    FormsModule,
    LootContextEditorComponent
],
  providers: [ItemDetailStore],
  host: {
    class: 'block',
  },
})
export class ItemTabsComponent {
  private db = injectNwData()
  private store = inject(ItemDetailStore)
  public itemId = input<string>()
  public tabId = toSignal(observeQueryParam(inject(ActivatedRoute), 'itemTab'))

  #fxLoad = effect(() => {
    const itemId = this.itemId()
    untracked(() => this.store.load({ recordId: itemId }))
  })

  protected appearanceResource = resource({
    params: this.store.record,
    loader: ({ params }) => loadAppearance(this.db, params),
  })
  protected appearance = resourceValue(this.appearanceResource)

  protected grantsEffectsResource = resource({
    params: this.store.record,
    loader: ({ params }) => loadGrantedEffectIds(this.db, params),
  })
  protected grantsEffects = resourceValue(this.grantsEffectsResource)

  protected resourcePercsResource = resource({
    params: this.store.record,
    loader: ({ params }) => loadResourcePerks(this.db, params),
  })
  protected resourcePerks = resourceValue(this.resourcePercsResource)

  protected unlocksRecipeResource = resource({
    params: this.store.record,
    loader: ({ params }) => loadUnlockedRecipe(this.db, params),
  })
  protected unlocksRecipe = resourceValue(this.unlocksRecipeResource)

  protected craftableRecipesResource = resource({
    params: this.store.record,
    loader: ({ params }) => loadCraftableRecipes(this.db, params),
  })
  protected craftableRecipes = resourceValue(this.craftableRecipesResource)

  protected lootTableIdsResource = resource({
    params: this.store.record,
    loader: ({ params }) => loadLootTableIds(this.db, params),
  })
  protected lootTableIds = resourceValue(this.lootTableIdsResource)

  protected recipesResource = resource({
    params: this.store.record,
    loader: ({ params }) => loadRecipes(this.db, params),
  })
  protected recipes = resourceValue(this.recipesResource)

  protected rewardedFromResource = resource({
    params: this.store.record,
    loader: ({ params }) => loadRewardedFrom(this.db, params),
  })
  protected rewardedFrom = resourceValue(this.rewardedFromResource)
  protected rewardGroups = computed(() => {
    return uniq((this.rewardedFrom()?.rewards || []).map((it) => it.season))
      .sort()
      .reverse()
  })
  protected rewardGroup = linkedSignal(() => {
    return this.rewardGroups()[0]
  })
  protected rewardSelection = computed(() => {
    const selection = this.rewardGroup()
    return (this.rewardedFrom()?.rewards || []).filter((it) => eqCaseInsensitive(it.season, selection))
  })

  protected dropSourceResource = resource({
    params: this.itemId,
    loader: ({ params }) => {
      return this.db.itemLootSources(params)
    },
  })
  protected dropSource = resourceValue(this.dropSourceResource)
  protected droppedBy = computed(() => this.dropSource()?.droppedBy)
  protected salvagedFrom = computed(() => this.dropSource()?.salvagedFrom)

  protected salvagesToResource = resource({
    params: this.itemId,
    loader: ({ params }) => {
      return this.db.itemSalvagesTo(params)
    }
  })
  protected salvagesTo = resourceValue(this.salvagesToResource)
  protected salvageLoot = computed(() => {
    const context = itemSalvageContext(this.store.item())
    if (!context) {
      return null
    }
    return {
      table: itemSalvageLootTable(this.store.item()),
      tags: Array.from(context.tags),
      values: Object.fromEntries(context.values.entries()),
      items: this.salvagesTo() || []
    }
  })

  protected perkBucketIds = computed(() => {
    const item = this.store.record()
    return getItemPerkBucketIds(isMasterItem(item) ? item : null)
  })

  protected activeTab = computed(() => {
    const activeTab = this.tabId()
    const items = this.tabItems()
    if (!items?.length) {
      return null
    }
    for (const item of items) {
      if (item.id === activeTab) {
        return activeTab
      }
    }
    return items[0].id
  })

  protected tabItems = computed(() => {
    const tabs: ItemTab[] = []
    if (this.grantsEffects()?.length) {
      tabs.push({
        id: 'effects',
        label: 'Grants Effects',
      })
    }

    if (this.resourcePerks()?.length) {
      tabs.push({
        id: 'perks',
        label: 'Perks',
      })
    }

    if (this.unlocksRecipe()) {
      tabs.push({
        id: 'unlocks',
        label: 'Unlocks Recipe',
      })
    }
    if (this.recipes()?.length) {
      tabs.push({
        id: 'recipes',
        label: 'Recipes',
      })
    }
    if (this.craftableRecipes()?.length) {
      const count = this.craftableRecipes().length
      tabs.push({
        id: 'craftable',
        label: 'Used to craft' + (count > 10 ? ` (${count})` : ''),
      })
    }
    if (this.perkBucketIds()?.length) {
      tabs.push({
        id: 'perks',
        label: `Perk Buckets`,
      })
    }
    if (this.appearance()) {
      tabs.push({
        id: 'transmog',
        label: `Transmog`,
      })
    }

    if (this.lootTableIds()?.length) {
      tabs.push({
        id: 'loot',
        label: 'Drop Tables',
      })
    }

    if (
      this.rewardedFrom()?.rewards?.length ||
      this.rewardedFrom()?.entitlements?.length ||
      this.rewardedFrom()?.items?.length
    ) {
      tabs.push({
        id: 'rewards',
        label: 'Rewarded From',
      })
    }

    if (this.droppedBy()?.length) {
      tabs.push({
        id: 'dropped-by',
        label: `Dropped by (${this.droppedBy()?.length})`,
      })
    }

    if (this.salvagedFrom()?.length) {
      tabs.push({
        id: 'salvaged-from',
        label: `Salvaged from (${this.salvagedFrom()?.length})`,
      })
    }
    if (this.salvageLoot()) {
      tabs.push({
        id: 'salvages-to',
        label: `Salvages to (${this.salvageLoot().items.length})`
      })
    }

    return tabs
  })
}

async function loadAppearance(db: NwData, item: MasterItemDefinitions | HouseItems) {
  if (!item || !isMasterItem(item)) {
    return null
  }
  return await Promise.all([
    db.armorAppearancesById(item.ArmorAppearanceM),
    db.armorAppearancesById(item.ArmorAppearanceF),
    db.weaponAppearancesById(item.WeaponAppearanceOverride),
    db.instrumentAppearancesById(item.WeaponAppearanceOverride),
  ]).then((list) => list.find((it) => !!it))
}

async function loadGrantedEffectIds(db: NwData, item: MasterItemDefinitions | HouseItems) {
  const ids: string[] = []
  if (isHousingItem(item)) {
    ids.push(item.HousingStatusEffect)
  }
  if (isMasterItem(item)) {
    const consumable = await db.consumableItemsById(getItemId(item))
    ids.push(...(consumable?.AddStatusEffects || []))
  }
  return ids.filter((it) => !!it)
}

async function loadResourcePerks(db: NwData, item: MasterItemDefinitions | HouseItems) {
  if (!item) {
    return null
  }
  const resource = await db.resourceItemsById(getItemId(item))
  if (!resource?.PerkBucket) {
    return null
  }
  const bucket = await db.perkBucketsById(resource.PerkBucket)
  return getPerkBucketPerkIDs(bucket)
}

async function loadUnlockedRecipe(db: NwData, item: MasterItemDefinitions | HouseItems) {
  if (!item || !isMasterItem(item) || !item.SalvageAchievement) {
    return null
  }
  const recipes = await db.recipesByRequiredAchievementId(item.SalvageAchievement)
  return recipes
}

async function loadCraftableRecipes(db: NwData, item: MasterItemDefinitions | HouseItems) {
  if (!item) {
    return null
  }
  const recipes = await db.recipesByIngredient(getItemId(item))
  return (recipes || [])
    .map((it) => {
      return {
        recipe: it,
        itemId: getItemIdFromRecipe(it),
      }
    })
    .filter((it) => !!it.itemId)
}

async function loadLootTableIds(db: NwData, item: MasterItemDefinitions | HouseItems) {
  if (!item) {
    return null
  }
  const tables = await db.lootTablesByLootItemId(getItemId(item))
  const buckets = await db.lootBucketsByItemId(getItemId(item))
  const result: string[] = []
  for (const table of tables || []) {
    result.push(table.LootTableID)
  }
  for (const bucket of buckets || []) {
    const bucketTables = await db.lootTablesByLootBucketId(bucket.LootBucket)
    for (const table of bucketTables || []) {
      if (table) {
        result.push(table.LootTableID)
      }
    }
  }
  return uniq(result)
}

async function loadRecipes(db: NwData, item: MasterItemDefinitions | HouseItems) {
  if (!item) {
    return null
  }
  const recipes = await db.recipesByItemId(getItemId(item))
  return (recipes || [])
    .map((it) => {
      return {
        recipe: it,
        itemId: getItemIdFromRecipe(it),
      }
    })
    .filter((it) => !!it.itemId)
}

async function loadRewardedFrom(db: NwData, item: MasterItemDefinitions | HouseItems) {
  if (!item) {
    return null
  }

  const rewards = await Promise.all([
    db.seasonsRewardsByDisplayItemId(getItemId(item)).then((it) => it || []),
    db.seasonsRewardsByItemId(getItemId(item)).then((it) => it || []),
  ]).then((list) => {
    return list.flat()
  })
  if (!rewards?.length) {
    return null
  }

  const entitlementIds = uniq((rewards || []).map((it) => it.EntitlementIds || []).flat())
  const itemIds = uniq((rewards || []).map((it) => it.ItemId || []).flat()).filter(
    (it) => !eqCaseInsensitive(it, getItemId(item)),
  )

  const result = {
    entitlements: entitlementIds,
    items: itemIds,
    rewards: await Promise.all(
      rewards.map(async (it) => {
        const ranks = await db.seasonPassRanksByRewardId(it.RewardId)
        const chapters = await db.seasonsRewardsChaptersByRewardId(it.RewardId)
        const source: Array<{ season: string; level?: number; chapter?: number; link?: string; premium?: boolean }> = []
        for (const rank of ranks || []) {
          source.push({
            season: rank.FreeRewardId.split('_').shift(),
            level: rank.Level,
            link: `/season-pass/${rank.$source}-${rank.Level}`,
            premium: eqCaseInsensitive(rank.PremiumRewardId, it.RewardId),
          })
        }
        for (const chapter of chapters || []) {
          source.push({
            season: chapter.ChapterRewardId.split('_').shift(),
            chapter: chapter.ChapterIndex,
          })
        }
        return source
      }),
    ).then((it) => it.flat()),
  }
  return result
}

function resourceValue<T>(resource: ResourceRef<T>): Signal<T> {
  return linkedSignal({
    source: () => ({
      value: resource.hasValue() ? resource.value() : null,
      isLoading: resource.isLoading(),
    }),
    computation: (source, previous) => {
      if (previous && source.isLoading) {
        return previous.value
      }
      return source.value
    },
  })
}
