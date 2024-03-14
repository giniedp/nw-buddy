import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component, Input, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { combineLatest, map } from 'rxjs'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { PaginationModule } from '~/ui/pagination'
import { observeQueryParam, shareReplayRefCount } from '~/utils'
import { CraftingCalculatorComponent } from '~/widgets/crafting'
import { AppearanceDetailModule } from '~/widgets/data/appearance-detail'
import { ItemDetailModule, ItemDetailStore } from '~/widgets/data/item-detail'
import { PerkBucketDetailModule } from '~/widgets/data/perk-bucket-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { ModelViewerService } from '~/widgets/model-viewer'
import { LootGraphComponent } from '~/widgets/loot/loot-graph.component'

export interface Tab {
  id: 'effects' | 'perks' | 'unlocks' | 'craftable' | 'recipes' | 'transmog' | 'gearset' | 'loot'
  label: string
}

@Component({
  standalone: true,
  selector: 'nwb-item-page-tabs',
  templateUrl: './item-tabs.component.html',
  // changeDetection: ChangeDetectionStrategy.OnPush,
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
  ],
  host: {
    class: 'block',
  },
})
export class ItemTabsComponent extends ItemDetailStore {
  @Input()
  public set itemId(value: string) {
    this.patchState({ recordId: value })
  }

  protected trackByIndex = (i: number) => i
  protected appearance$ = combineLatest({
    armorM: this.appearanceM$,
    armorF: this.appearanceF$,
    weapon: this.weaponAppearance$,
    instrument: this.instrumentAppearance$,
  }).pipe(
    map(({ armorM, armorF, weapon, instrument }) => {
      return armorM || armorF || weapon || instrument
    })
  )

  protected vm$ = combineLatest({
    entityId: this.select((it) => it.recordId),
    grantsEffects: this.statusEffectsIds$,
    resourcePerks: this.resourcePerkIds$,
    unlocksRecipe: this.salvageAchievementRecipe$,
    craftableRecipes: this.craftableRecipes$,
    perkBucketIds: this.perkBucketIds$,
    lootTableIds: this.dropTableIds$,
    recipes: this.recipes$,
    tabId: observeQueryParam(inject(ActivatedRoute), 'itemTab'),
    appearance: this.appearance$,
  })
    .pipe(
      map((data) => {
        const tabs: Tab[] = []
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

        const tabIds = tabs.map((it) => it.id)
        return {
          ...data,
          tabs,
          tabId: tabIds.find((it) => it === data.tabId) || tabIds[0],
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(db: NwDataService, ms: ModelViewerService, cdref: ChangeDetectorRef) {
    super(db, ms, cdref)
  }
}
