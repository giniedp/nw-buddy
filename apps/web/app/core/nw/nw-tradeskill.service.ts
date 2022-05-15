import { Injectable } from '@angular/core'
import { Tradeskillpostcap } from '@nw-data/types'
import { groupBy, uniq } from 'lodash'
import { combineLatest, defer, isObservable, map, Observable, of, shareReplay, switchMap } from 'rxjs'
import { TradeskillPreferencesService } from '../preferences/tradeskill-preferences.service'
import { shareReplayRefCount } from '../utils'
import { NwDbService, toMap } from './nw-db.service'

export interface NwTradeskillInfo {
  ID: string
  Category: string
  Name: string
  MaxLevel: number
  Icon: string
  Postcap: Tradeskillpostcap
}

export interface NwTradeskillLevel {
  Level: number
  MaximumInfluence: number
  InfluenceCost: number
}

const CATEGORY_MAP = {
  Weaponsmithing: 'Crafting',
  Armoring: 'Crafting',
  Engineering: 'Crafting',
  Jewelcrafting: 'Crafting',
  Arcana: 'Crafting',
  Cooking: 'Crafting',
  Furnishing: 'Crafting',
  Smelting: 'Refining',
  Woodworking: 'Refining',
  Leatherworking: 'Refining',
  Weaving: 'Refining',
  Stonecutting: 'Refining',
  Logging: 'Gathering',
  Mining: 'Gathering',
  Fishing: 'Gathering',
  Harvesting: 'Gathering',
  Skinning: 'Gathering',
}

@Injectable({ providedIn: 'root' })
export class NwTradeskillService {
  public skills = defer(() => {
    return combineLatest({
      postcap: this.db.tradeskillPostcap,
      categories: this.db.categoriesProgression,
    })
  })
    .pipe(
      map(({ postcap, categories }) => {
        return categories
          .filter((it) => !!it.PostSkillCapSkill)
          .map((it): NwTradeskillInfo => {
            return {
              ID: it.CategoricalProgressionId,
              Category: CATEGORY_MAP[it.CategoricalProgressionId],
              Name: it.DisplayName,
              MaxLevel: it.MaxLevel,
              Icon: `./assets/icons/tradeskills/${it.CategoricalProgressionId.toLowerCase()}.png`,
              Postcap: postcap.find((cap) => cap.TradeSkillType === it.PostSkillCapSkill),
            }
          })
          .filter((it) => !!it.Postcap)
      })
    )
    .pipe(
      shareReplay({
        refCount: true,
        bufferSize: 1,
      })
    )

  public skillsMap = defer(() => this.skills)
    .pipe(map((it) => toMap(it, 'ID')))
    .pipe(shareReplayRefCount(1))

  public categories = defer(() => this.skills)
    .pipe(map((it) => uniq(it.map((i) => i.Category))))
    .pipe(shareReplayRefCount(1))

  public constructor(private db: NwDbService, public preferences: TradeskillPreferencesService) {
    //
  }

  public skillsByCategory(category: Observable<string> | string) {
    return combineLatest({
      cat: isObservable(category) ? category : of(category),
      skills: this.skills,
    }).pipe(
      map(({ cat, skills }) => {
        return skills.filter((it) => !cat || it.Category === cat)
      })
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
      switchMap((it) => {
        const name = it.toLocaleLowerCase()
        const fnName = `tradeskill${name}`
        if (!(fnName in this.db.data)) {
          console.warn(`data function not found`, fnName)
          return of<NwTradeskillLevel[]>([])
        }
        return this.db.data[fnName]() as Observable<NwTradeskillLevel[]>
      })
    )
  }

  public calculateProgress(skill: NwTradeskillInfo, levels: NwTradeskillLevel[], startLevel: number, addXp: number) {
    const result = {
      finalLevel: 0,
      finalXp: 0,
      aptitude: 0,
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
