import { CommonModule } from '@angular/common'
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Input, TemplateRef, ViewChild } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { combineLatest, map } from 'rxjs'
import { NwModule } from '~/nw'
import { NwDataService } from '~/data'
import { PaginationModule } from '~/ui/pagination'
import { observeQueryParam, shareReplayRefCount } from '~/utils'
import { CraftingCalculatorComponent } from '~/widgets/crafting'
import { ItemDetailModule, ItemDetailStore } from '~/widgets/data/item-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { ModelViewerService } from '~/widgets/model-viewer'

export interface Tab {
  id: 'effects' | 'perks' | 'unlocks' | 'craftable' | 'recipes'
  label: string
}

@Component({
  standalone: true,
  selector: 'nwb-housing-page-tabs',
  templateUrl: './housing-detail-tabs.component.html',
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
  ],
  host: {
    class: 'layout-content',
  },
})
export class HousingTabsComponent extends ItemDetailStore {
  @Input()
  public set itemId(value: string) {
    this.patchState({ recordId: value })
  }

  protected trackByIndex = (i: number) => i
  protected vm$ = combineLatest({
    grantsEffects: this.statusEffectsIds$,
    resourcePerks: this.resourcePerkIds$,
    unlocksRecipe: this.salvageAchievementRecipe$,
    craftableRecipes: this.craftableRecipes$,
    recipes: this.recipes$,
    tabId: observeQueryParam(this.route, 'itemTab'),
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

        const tabIds = tabs.map((it) => it.id)
        return {
          ...data,
          tabs,
          tabId: tabIds.find((it) => it === data.tabId) || tabIds[0],
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(db: NwDataService, ms: ModelViewerService, cdref: ChangeDetectorRef, private route: ActivatedRoute) {
    super(db, ms, cdref)
  }
}
