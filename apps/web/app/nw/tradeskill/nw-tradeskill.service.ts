import { Injectable } from '@angular/core'
import { DATASHEETS, TradeSkillPostCapData } from '@nw-data/generated'
import { uniq } from 'lodash'
import { Observable, combineLatest, defer, isObservable, map, of, shareReplay, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { tableIndexBy } from '~/data/nw-data/dsl'
import { eqCaseInsensitive, shareReplayRefCount } from '~/utils'
import { NW_TRADESKILLS_INFOS_MAP } from './nw-tradeskill'

export interface NwTradeskillInfo {
  ID: string
  Category: string
  Name: string
  MaxLevel: number
  Icon: string
  Postcap: TradeSkillPostCapData
}

export interface NwTradeskillLevel {
  Level: number
  MaximumInfluence: number
  InfluenceCost: number
}

@Injectable({ providedIn: 'root' })
export class NwTradeskillService {
  private db = injectNwData()

  public skills = defer(() => {
    return combineLatest({
      postcap: this.db.tradeskillPostcapAll(),
      categories: this.db.categoricalProgressionAll(),
    })
  })
    .pipe(
      map(({ postcap, categories }) => {
        return (
          categories
            //.filter((it) => !!it.PostSkillCapSkill)
            .map((it): NwTradeskillInfo => {
              const info = NW_TRADESKILLS_INFOS_MAP.get(it.CategoricalProgressionId)
              if (!info) {
                return null
              }

              return {
                ID: info.ID,
                Category: info.Category,
                Icon: info.Icon,
                Name: it.DisplayName,
                MaxLevel: it.Expansion01MaxLevel || it.MaxLevel,
                Postcap: postcap.find((cap) => cap.TradeSkillType === it.PostSkillCapSkill),
              }
            })
            .filter((it) => !!it)
        )
      }),
    )
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      }),
    )

  public skillsMap = tableIndexBy(() => this.skills, 'ID')

  public categories = defer(() => this.skills)
    .pipe(map((it) => uniq(it.map((i) => i.Category))))
    .pipe(shareReplayRefCount(1))

  public skillsByCategory(category: Observable<string> | string) {
    return combineLatest({
      cat: isObservable(category) ? category : of(category),
      skills: this.skills,
    }).pipe(
      map(({ cat, skills }) => {
        return skills.filter((it) => !cat || eqCaseInsensitive(it.Category, cat))
      }),
    )
  }

  public skillByName(name: Observable<string> | string) {
    return combineLatest({
      name: isObservable(name) ? name : of(name),
      skills: this.skillsMap,
    }).pipe(map(({ name, skills }) => skills.get(name)))
  }

  public skillTableByName(name: Observable<string> | string) {
    const name$ = isObservable(name) ? name : of(name)
    return name$.pipe(
      switchMap((skillName) => {
        for (const key in DATASHEETS.TradeskillRankData) {
          if (eqCaseInsensitive(key, skillName)) {
            return this.db.loadDatasheet(DATASHEETS.TradeskillRankData[key as 'Arcana'])
          }
        }
        return of(null)
      }),
    )
  }

  public calculateProgress(skill: NwTradeskillInfo, levels: NwTradeskillLevel[], startLevel: number, addXp: number) {
    const result = {
      finalLevel: 0,
      finalXp: 0,
      aptitude: 0,
    }
    if (!skill || !levels?.length) {
      return result
    }
    for (const level of levels) {
      if (level.Level < startLevel) {
        result.finalLevel = level.Level + 1
        result.finalXp += level.InfluenceCost
        continue
      }
      if (level.Level >= skill.MaxLevel) {
        break
      }
      if (level.InfluenceCost < addXp) {
        result.finalLevel += 1
        result.finalXp += level.InfluenceCost
        addXp -= level.InfluenceCost
      } else {
        result.finalLevel += addXp / level.InfluenceCost
        result.finalXp += addXp
        addXp = 0
        break
      }
    }

    if (addXp > 0 && result.finalLevel === skill.MaxLevel) {
      result.aptitude = addXp / skill.Postcap.TradeSkillRewardXP
      addXp = 0
    }
    return result
  }
}
