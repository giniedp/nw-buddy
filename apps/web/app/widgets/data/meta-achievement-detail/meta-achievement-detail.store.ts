import { Injectable, Output, inject } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { NW_FALLBACK_ICON } from '@nw-data/common'
import { MetaAchievementData } from '@nw-data/generated'
import { NwDataService } from '~/data'
import { humanize, rejectKeys, selectStream, tapDebug } from '~/utils'

@Injectable()
export class MetaAchievementDetailStore extends ComponentStore<{ achievementId: string }> {
  protected db = inject(NwDataService)

  public readonly achievementId$ = this.select(({ achievementId }) => achievementId)
  public readonly achievement$ = selectStream(this.db.metaAchievement(this.achievementId$))
  public readonly icon$ = this.select(this.achievement$, (it) => it?.Icon || NW_FALLBACK_ICON)
  public readonly title$ = this.select(this.achievement$, (it) => it?.Title)
  public readonly description$ = this.select(this.achievement$, (it) => it?.Description)
  public readonly displayCategory$ = this.select(this.achievement$, (it) => humanize(it?.UIDisplayCategory))
  public readonly tierLabel$ = this.select(this.achievement$, (it) => it?.Tier)
  public readonly properties$ = this.select(this.achievement$, selectProperties)

  public constructor() {
    super({ achievementId: null })
  }

  public load(idOrItem: string | MetaAchievementData) {
    if (typeof idOrItem === 'string') {
      this.patchState({ achievementId: idOrItem })
    } else {
      this.patchState({ achievementId: idOrItem?.AchievementsID })
    }
  }
}

function selectProperties(item: MetaAchievementData) {
  const reject: Array<keyof MetaAchievementData> = ['Title', 'Description', 'Icon', 'UIDisplayCategory', 'Tier']
  return rejectKeys(item, (key) => !item[key] || reject.includes(key))
}
