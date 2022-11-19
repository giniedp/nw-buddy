import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { from, map, switchMap, tap } from 'rxjs'
import { NW_MAX_CHARACTER_LEVEL, NW_MAX_TRADESKILL_LEVEL, NW_MAX_WEAPON_LEVEL } from '~/nw/utils/constants'
import { CaseInsensitiveMap } from '~/utils'
import { CharacterRecord, CharactersDB } from './characters.db'

export interface CharacterStoreState {
  current: CharacterRecord
}

@Injectable({ providedIn: 'root' })
export class CharacterStore extends ComponentStore<CharacterStoreState> {
  public readonly current$ = this.select(({ current }) => current)
  public readonly level$ = this.select(({ current }) => current?.level ?? NW_MAX_CHARACTER_LEVEL)
  public readonly tradeskills$ = this.select(({ current }) => current?.tradeskillLevels)
  public readonly weapons$ = this.select(({ current }) => current?.weaponLevels)

  public selectTradeSkillLevel(skill: string) {
    return this.tradeskills$.pipe(
      map((it) => {
        const data = new CaseInsensitiveMap(Object.entries(it || {}))
        const value = data.get(skill)
        return value ?? NW_MAX_TRADESKILL_LEVEL
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

  public constructor(private db: CharactersDB) {
    super({
      current: null,
    })
    const src$ = from(migrate(db)).pipe(switchMap(() => this.db.observeCurrent()))
    this.loadCurrent(src$)
  }

  public readonly loadCurrent = this.updater((state, current: CharacterRecord) => {
    return {
      ...state,
      current,
    }
  })

  public readonly updateLevel = this.effect<{ level: number }>((value$) => {
    return value$.pipe(
      tap(({ level }) => {
        const current = this.get().current
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
        const current = this.get().current
        this.writeRecord({
          ...current,
          tradeskillLevels: {
            ...current.tradeskillLevels,
            [skill]: level,
          },
        })
      })
    )
  })

  public readonly updateWeaponLevel = this.effect<{ weapon: string; level: number }>((value$) => {
    return value$.pipe(
      tap(({ weapon, level }) => {
        const current = this.get().current
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

  private writeRecord(record: CharacterRecord) {
    return from(this.db.update(record.id, record)).pipe(
      tap({
        next: (value) => this.loadCurrent(value),
        error: (e) => console.error(e),
      })
    )
  }
}

async function migrate(db: CharactersDB) {
  await migrateCharacterLevel(db)
  await migrateTradeskillLevels(db)
}

async function migrateCharacterLevel(db: CharactersDB) {
  const item = localStorage.getItem('nwb:character')
  if (!item) {
    return
  }
  const obj: Record<string, any> = JSON.parse(item)
  const level = Number(obj?.['language']) // HINT: used wrong key name to store character level
  if (level && Number.isFinite(level)) {
    console.log('detected level', level)
    const char = await db.getCurrent()
    await db.update(char.id, {
      ...char,
      level: level,
    })
  }
  localStorage.removeItem('nwb:character')
}

async function migrateTradeskillLevels(db: CharactersDB) {
  const item = localStorage.getItem('nwb:tradeskills')
  if (!item) {
    return
  }
  const obj: Record<string, any> = JSON.parse(item)
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const levels: Record<string, number> = {}
    Object.entries(obj).forEach(([skill, it]) => {
      const level = Number(it?.level)
      if (Number.isFinite(level)) {
        levels[skill] = level
      }
    })
    console.log('detected tradeskills', levels)
    const char = await db.getCurrent()
    await db.update(char.id, {
      ...char,
      tradeskillLevels: {
        ...(char.tradeskillLevels || {}),
        ...levels,
      },
    })
  }
  localStorage.removeItem('nwb:tradeskills')
}
