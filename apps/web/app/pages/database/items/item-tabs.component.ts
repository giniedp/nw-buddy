import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, untracked } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, RouterModule } from '@angular/router'
import {
  getItemId,
  getItemIdFromRecipe,
  getItemPerkBucketIds,
  getPerkBucketPerkIDs,
  isHousingItem,
  isMasterItem,
} from '@nw-data/common'
import { NwData } from '@nw-data/db'
import { HouseItems, MasterItemDefinitions } from '@nw-data/generated'
import { uniq } from 'lodash'
import { injectNwData } from '~/data'
import { NwModule } from '~/nw'
import { PaginationModule } from '~/ui/pagination'
import { TabsModule } from '~/ui/tabs'
import { apiResource, observeQueryParam } from '~/utils'
import { CraftingCalculatorComponent } from '~/widgets/crafting'
import { AppearanceDetailModule } from '~/widgets/data/appearance-detail'
import { ItemDetailModule, ItemDetailStore } from '~/widgets/data/item-detail'
import { PerkBucketDetailModule } from '~/widgets/data/perk-bucket-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { LootGraphComponent } from '~/widgets/loot/loot-graph.component'

export type ItemTabId = 'effects' | 'perks' | 'unlocks' | 'craftable' | 'recipes' | 'transmog' | 'gearset' | 'loot'
export interface ItemTab {
  id: ItemTabId
  label: string
}

@Component({
  standalone: true,
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
    PerkBucketDetailModule,
    AppearanceDetailModule,
    LootGraphComponent,
    TabsModule,
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

  protected resource = apiResource({
    request: () => this.store.record(),
    loader: async ({ request }) => {
      return {
        appearance: await loadAppearance(this.db, request),
        grantsEffects: await loadGrantedEffectIds(this.db, request),
        resourcePerks: await loadResourcePerks(this.db, request),
        unlocksRecipe: await loadUnlockedRecipe(this.db, request),
        craftableRecipes: await loadCraftableRecipes(this.db, request),
        perkBucketIds: getItemPerkBucketIds(isMasterItem(request) ? request : null),
        lootTableIds: await loadLootTableIds(this.db, request),
        recipes: await loadRecipes(this.db, request),
      }
    },
  })
  protected data = this.resource.value

  protected activeTab = computed(() => {
    const activeTab = this.tabId()
    const items = this.tabItems()
    if ((this.resource.isLoading() && !this.resource.isLoaded()) || !items?.length) {
      return activeTab
    }
    return items.find((it) => it.id === activeTab) ? activeTab : items[0].id
  })
  protected tabItems = computed(() => {
    const data = this.resource.value()
    if (!data) {
      return null
    }
    const tabs: ItemTab[] = []
    if (data.grantsEffects?.length) {
      tabs.push({
        id: 'effects',
        label: 'Grants Effects',
      })
    }

    if (data.resourcePerks?.length) {
      tabs.push({
        id: 'perks',
        label: 'Perks',
      })
    }

    if (data.unlocksRecipe) {
      tabs.push({
        id: 'unlocks',
        label: 'Unlocks Recipe',
      })
    }
    if (data.recipes?.length) {
      tabs.push({
        id: 'recipes',
        label: 'Recipes',
      })
    }
    if (data.craftableRecipes?.length) {
      const count = data.craftableRecipes.length
      tabs.push({
        id: 'craftable',
        label: 'Used to craft' + (count > 10 ? ` (${count})` : ''),
      })
    }
    if (data.perkBucketIds?.length) {
      tabs.push({
        id: 'perks',
        label: `Perk Buckets`,
      })
    }
    if (data.appearance) {
      tabs.push({
        id: 'transmog',
        label: `Transmog`,
      })
    }

    if (data.lootTableIds?.length) {
      tabs.push({
        id: 'loot',
        label: 'Drop Tables',
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
