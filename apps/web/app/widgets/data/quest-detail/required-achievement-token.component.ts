import { Component, HostBinding, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { RouterModule } from '@angular/router'
import {
  NW_FALLBACK_ICON,
  getItemIconPath,
  getItemId,
  getItemIdFromRecipe,
  getQuestTypeIcon,
  isHousingItem,
} from '@nw-data/common'
import { AchievementData } from '@nw-data/generated'
import { Observable, from, map, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { NwLinkService, NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { combineLatestOrEmpty, selectSignal } from '~/utils'
import { AchievementExpression } from './utils/achievement-expression'

export interface AchievementResource {
  icon: string
  label: string
  routerLink: string
}

@Component({
  selector: 'nwb-required-achievement-token',
  template: `
    @switch (token()?.type) {
      @case ('OR') {
        <span class="badge badge-sm badge-info"> OR </span>
      }
      @case ('AND') {
        <span class="badge badge-sm badge-info"> AND </span>
      }
      @case ('NOT') {
        <span>NOT</span>
      }
      @case ('expression') {
        @for (token of token().expression; track $index) {
          <nwb-required-achievement-token [token]="token" />
        }
      }
      @case ('value') {
        @for (row of resource(); track $index) {
          <a [routerLink]="row.routerLink" class="flex flex-row gap-1 link-hover">
            <img [nwImage]="row.icon" class="w-5 h-5" />
            <span>{{ row.label | nwText }}</span>
          </a>
        } @empty {
          <span class="font-mono text-secondary">{{ token().value }}</span>
        }
      }
    }
  `,
  host: {
    class: 'block',
  },
  imports: [NwModule, RouterModule, IconsModule],
})
export class RequiredAchievementTokenComponent {
  private db = injectNwData()
  private link = inject(NwLinkService)

  public token = input.required<AchievementExpression>()
  protected achievementId = selectSignal(this.token, (it) => it?.value)
  protected achievement = selectSignal(
    toObservable(this.achievementId).pipe(switchMap((id) => this.db.achievementsById(id))),
  )
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
      return from(this.db.recipesByFirstCraftAchievementId(achievementId)).pipe(
        switchMap((list = []) => {
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
      return from(this.db.territoriesByDiscoveredAchievement(achievementId)).pipe(
        map((list = []) => {
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
      return from(this.db.objectivesByAchievementId(achievementId)).pipe(
        map((list = []) => {
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
