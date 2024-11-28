import { Injectable } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { ComponentStore } from '@ngrx/component-store'
import { from, map, switchMap, tap } from 'rxjs'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_TRADESKILL_LEVEL, NW_MAX_WEAPON_LEVEL } from '@nw-data/common'
import { CaseInsensitiveMap, CaseInsensitiveSet } from '~/utils'

import { ImageRecord, ImagesDB } from '../images'
import { CharacterRecord } from './types'
import { CharactersDB } from './characters.db'
import { injectWindow } from '~/utils/injection/window'
import { injectIsBrowser } from '~/utils/injection/platform'
import { signalStore, withHooks, withMethods, withState } from '@ngrx/signals'

export interface CharacterStoreState {
  data: CharacterRecord
}

// export const CharacterStore = signalStore(
//   withState<CharacterStoreState>({
//     data: null,
//   }),
//   withMethods
//   withHooks({
//     onInit: () => {

//     }
//   })
// )

@Injectable({ providedIn: 'root' })
export class CharacterStore extends ComponentStore<CharacterStoreState> {
  private window = injectWindow()
  public readonly current$ = this.select(({ data }) => data)
  public readonly name$ = this.select(({ data }) => data?.name)
  public readonly serverName$ = this.select(({ data }) => data?.serverName)
  public readonly companyName$ = this.select(({ data }) => data?.companyName)
  public readonly faction$ = this.select(({ data }) => data?.faction)
  public readonly level$ = this.select(({ data }) => data?.level ?? NW_MAX_CHARACTER_LEVEL)
  public readonly tradeskills$ = this.select(({ data }) => data?.tradeskillLevels)
  public readonly tradeskillSets$ = this.select(({ data }) => data?.tradeskillSets)
  public readonly tradeskillBonus$ = this.select(({ data }) => data?.tradeskillBonus)
  public readonly craftingFlBonus$ = this.select(({ data }) => data?.craftingFlBonus)
  public readonly weapons$ = this.select(({ data }) => data?.weaponLevels)
  public readonly imageId$ = this.select(({ data }) => data?.imageId)
  public readonly imageRecord$ = this.imageId$.pipe(
    switchMap((id) => this.images.observeByid(id))
  )
  public readonly imageUrl$ = this.select(this.imageRecord$, (record) => this.selectImageUrl(record))

  public selectTradeSkillLevel(skill: string) {
    return this.tradeskills$.pipe(
      map((it) => {
        const data = new CaseInsensitiveMap(Object.entries(it || {}))
        const value = data.get(skill)
        return value ?? NW_MAX_TRADESKILL_LEVEL
      })
    )
  }

  public selectTradeSet(skill: string) {
    return this.tradeskillSets$.pipe(
      map((it) => {
        const data = new CaseInsensitiveMap(Object.entries(it || {}))
        return data.get(skill) || []
      })
    )
  }

  public selectCustomYieldBonus(skill: string) {
    return this.tradeskillBonus$.pipe(
      map((it) => {
        const data = new CaseInsensitiveMap(Object.entries(it || {}))
        return data.get(skill) || 0
      })
    )
  }

  public selectWeaponLevel(weapon: string) {
    return this.weapons$.pipe(
      map((it) => {
        const data = new CaseInsensitiveMap(Object.entries(it || {}))
        const value = data.get(weapon)
        return value ?? NW_MAX_WEAPON_LEVEL
      })
    )
  }
  private isBrowser = injectIsBrowser()
  public constructor(private db: CharactersDB, private images: ImagesDB, private sanitizer: DomSanitizer) {
    super({
      data: null,
    })
    if (this.isBrowser){
      const src$ = this.db.observeCurrent()
      this.loadCurrent(src$)
    }
  }

  public readonly loadCurrent = this.updater((state, data: CharacterRecord) => {
    return {
      ...state,
      data,
    }
  })

  public readonly updateLevel = this.effect<{ level: number }>((value$) => {
    return value$.pipe(
      tap(({ level }) => {
        const current = this.get().data
        this.writeRecord({
          ...current,
          level,
        })
      })
    )
  })

  public readonly updateSkillLevel = this.effect<{ skill: string; level: number }>((value$) => {
    return value$.pipe(
      tap(({ skill, level }) => {
        const current = this.get().data
        this.writeRecord({
          ...current,
          tradeskillLevels: {
            ...current.tradeskillLevels,
            [skill]: Math.min(Math.max(0, level), NW_MAX_TRADESKILL_LEVEL),
          },
        })
      })
    )
  })

  public readonly updateSkillBonus = this.effect<{ skill: string; value: number }>((value$) => {
    return value$.pipe(
      tap(({ skill, value }) => {
        const current = this.get().data
        this.writeRecord({
          ...current,
          tradeskillBonus: {
            ...current.tradeskillBonus,
            [skill]: value,
          },
        })
      })
    )
  })

  public readonly updateWeaponLevel = this.effect<{ weapon: string; level: number }>((value$) => {
    return value$.pipe(
      tap(({ weapon, level }) => {
        const current = this.get().data
        this.writeRecord({
          ...current,
          weaponLevels: {
            ...current.weaponLevels,
            [weapon]: level,
          },
        })
      })
    )
  })

  public readonly toggleSkillSlot = this.effect<{ skill: string; slot: string }>((value$) => {
    return value$.pipe(
      tap(({ skill, slot }) => {
        const current = this.get().data
        const set = new CaseInsensitiveSet<string>(current?.tradeskillSets?.[skill] || [])
        if (set.has(slot)) {
          set.delete(slot)
        } else {
          set.add(slot)
        }
        this.writeRecord({
          ...current,
          tradeskillSets: {
            ...(current.tradeskillSets || {}),
            [skill]: Array.from(set.values()),
          },
        })
      })
    )
  })

  public readonly updateFlBonus = this.effect<{ value: boolean }>((value$) => {
    return value$.pipe(
      tap(({ value }) => {
        const current = this.get().data
        this.writeRecord({
          ...current,
          craftingFlBonus: value,
        })
      })
    )
  })

  private writeRecord(record: CharacterRecord) {
    return from(this.db.update(record.id, record)).pipe(
      tap({
        next: (value) => this.loadCurrent(value),
        error: (e) => console.error(e),
      })
    )
  }

  private selectImageUrl(record: ImageRecord) {
    if (!(record?.data instanceof ArrayBuffer)) {
      return null
    }
    const blob = new Blob([record.data], { type: record.type })
    const urlCreator = this.window.URL || this.window.webkitURL
    const url = urlCreator.createObjectURL(blob)
    return this.sanitizer.bypassSecurityTrustUrl(url)
  }
}
