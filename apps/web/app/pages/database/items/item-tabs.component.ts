import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component, Input, inject } from '@angular/core'
import { ActivatedRoute, RouterModule } from '@angular/router'
import { combineLatest, map } from 'rxjs'
import { NwDbService, NwModule } from '~/nw'
import { PaginationModule } from '~/ui/pagination'
import { observeQueryParam, shareReplayRefCount } from '~/utils'
import { CraftingCalculatorComponent } from '~/widgets/crafting'
import { AppearanceDetailModule } from '~/widgets/data/appearance-detail'
import { ItemDetailModule, ItemDetailStore } from '~/widgets/data/item-detail'
import { PerkBucketDetailModule } from '~/widgets/data/perk-bucket-detail'
import { PerkDetailModule } from '~/widgets/data/perk-detail'
import { StatusEffectDetailModule } from '~/widgets/data/status-effect-detail'
import { ModelViewerService } from '~/widgets/model-viewer'

export interface Tab {
  id: 'effects' | 'perks' | 'unlocks' | 'craftable' | 'recipes' | 'perks' | 'transmog'
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
  ],
  host: {
    class: 'block',
  },
})
export class ItemTabsComponent extends ItemDetailStore {
  @Input()
  public set itemId(value: string) {
    this.patchState({ entityId: value })
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
    entityId: this.select((it) => it.entityId),
    grantsEffects: this.statusEffectsIds$,
    resourcePerks: this.resourcePerkIds$,
    unlocksRecipe: this.salvageAchievementRecipe$,
    craftableRecipes: this.craftableRecipes$,
    perkBucketIds: this.perkBucketIds$,
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
        const tabIds = tabs.map((it) => it.id)
        return {
          ...data,
          tabs,
          tabId: tabIds.find((it) => it === data.tabId) || tabIds[0],
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  public constructor(db: NwDbService, ms: ModelViewerService, cdref: ChangeDetectorRef) {
    super(db, ms, cdref)
  }
}
