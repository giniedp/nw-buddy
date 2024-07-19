import { Component, HostBinding, inject, input } from '@angular/core'
import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemIdFromRecipe,
  getQuestTypeIcon,
  isHousingItem,
} from '@nw-data/common'
import { AchievementData } from '@nw-data/generated'
import { Observable, map, of, switchMap, switchScan } from 'rxjs'
import { NwDataService } from '~/data'
import { NwLinkService, NwModule } from '~/nw'
import { combineLatestOrEmpty, selectSignal, tapDebug } from '~/utils'
import { AchievementExpression } from './utils/achievement-expression'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import { IconsModule } from '~/ui/icons'

export interface AchievementResource {
  icon: string
  label: string
  routerLink: string
}

@Component({
  standalone: true,
  selector: 'nwb-required-achievement-token',
  templateUrl: './required-achievement-token.component.html',
  host: {
    class: 'block',
  },
  imports: [NwModule, RouterModule, IconsModule]
})
export class RequiredAchievementTokenComponent {
  private db = inject(NwDataService)
  private link = inject(NwLinkService)

  public token = input.required<AchievementExpression>()
  protected achievementId = selectSignal(this.token, (it) => it?.value)
  protected achievement = selectSignal(this.db.achievement(this.achievementId))
  protected resource = toSignal(toObservable(this.achievement).pipe(switchMap((it) => this.selectResource(it))))

  @HostBinding('class.border')
  @HostBinding('class.rounded')
  @HostBinding('class.border-base-100')
  @HostBinding('class.p-2')
  protected get hasBorder() {
    return this.token()?.type === 'expression'
  }

  private selectResource(achievement: AchievementData): Observable<AchievementResource[]> {
    const achievementId = achievement?.AchievementID
    const category = achievement?.Category
    if (!achievementId) {
      return of([])
    }
    if (category === 'CampSkin') {
      // crafting by UnlockedAchievementId
      // db.recipeByAchievementId(achievementId)
    }
    if (category === 'FirstCraft' || category === 'Recipe') {
      // crafting by FirstCraftAchievementId
      // db.recipes.pipe(map((list) => list.find((it) => eqCaseInsensitive(it.FirstCraftAchievementId, achievementId))))
      return this.db.recipesByFirstCraftAchievementId(achievementId).pipe(
        switchMap((list) => {
          return combineLatestOrEmpty(list.map((it) => this.db.itemOrHousingItem(getItemIdFromRecipe(it))))
        }),
        map((list) => {
          return list.map((it): AchievementResource => {
            return {
              icon: getItemIconPath(it) || NW_FALLBACK_ICON,
              label: it.Name,
              routerLink: this.link.resourceLink({ id: getItemId(it), type: isHousingItem(it) ? 'housing' : 'item' }),
            }
          })
        }),
      )
    }
    if (category === 'Journal') {
      // lore items by AchievementId
      // db.loreItems.pipe(map((list) => list.find((it) => eqCaseInsensitive(it.AchievementId, achievementId))))
    }
    if (category === 'LootLimit') {
      // loot limit by AchievementAtLimit
      // db.lootLimits.pipe(map((list) => list.find((it) => eqCaseInsensitive(it.AchievementAtLimit, achievementId))))
    }
    if (category === 'Map') {
      // db.territories.pipe(map((list) => list.find((it) => eqCaseInsensitive(it.DiscoveredAchievement, achievementId))))
      return this.db.territoriesByDiscoveredAchievement(achievementId).pipe(
        map((list) => {
          return list.map((it): AchievementResource => {
            return {
              icon: NW_FALLBACK_ICON,
              label: it.NameLocalizationKey || String(it.TerritoryID),
              routerLink: this.link.resourceLink({ id: String(it.TerritoryID), type: 'poi' }),
            }
          })
        }),
      )
    }
    if (category === 'Mount') {
      //
    }
    if (category === 'Store') {
      // db.entitlements.pipe(map((list) => list.find((it) => eqCaseInsensitive(it.AchievementId, achievementId))))
    }
    if (category === 'Title') {
      // db.playerTitles.pipe(map((list) => list.find((it) => eqCaseInsensitive(it.AchievementId, achievementId))))
    }
    if (category === 'Objective') {
      return this.db.objectivesByAchievementId(achievementId).pipe(
        tapDebug('objectivesByAchievementId'),
        map((list) => {
          return list.map((it): AchievementResource => {
            return {
              icon: getQuestTypeIcon(it.Type),
              label: it.Title || it.AchievementId,
              routerLink: this.link.resourceLink({ id: it.ObjectiveID, type: 'quest' }),
            }
          })
        }),
      )
    }
    return of([])
  }
}
