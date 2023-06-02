import { Injectable } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { ComponentStore } from '@ngrx/component-store'
import { AttributeRef } from '@nw-data/common'
import { from, map, of, switchMap, tap } from 'rxjs'

import { GearsetCreateMode, GearsetRecord, GearsetsDB } from './gearsets.db'
import { ImagesDB } from './images.db'
import { ItemInstance, ItemInstancesDB } from './item-instances.db'
import { SkillBuild } from './skill-builds.db'

export interface GearsetStoreState {
  level?: number
  gearset: GearsetRecord
  isLoading: boolean
}

@Injectable()
export class GearsetStore extends ComponentStore<GearsetStoreState> {
  public readonly gearset$ = this.select(({ gearset }) => gearset)
  public readonly gearsetId$ = this.select(({ gearset }) => gearset?.id)
  public readonly gearsetSlots$ = this.select(({ gearset }) => gearset?.slots)
  public readonly gearsetName$ = this.select(({ gearset }) => gearset?.name)
  public readonly gearsetAttrs$ = this.select(({ gearset }) => gearset?.attrs)
  public readonly gearsetEnforcedEffects$ = this.select(({ gearset }) => gearset?.enforceEffects)
  public readonly gearsetEnforcedAbilities$ = this.select(({ gearset }) => gearset?.enforceAbilities)
  public readonly skills$ = this.select(({ gearset }) => gearset?.skills)
  public readonly skillsPrimary$ = this.skills$.pipe(map((it) => it?.['primary']))
  public readonly skillsSecondary$ = this.skills$.pipe(map((it) => it?.['secondary']))
  public readonly isPersistable$ = this.select(({ gearset }) => !!gearset?.id)
  public readonly isLinkMode$ = this.select(({ gearset }) => gearset?.createMode !== 'copy')
  public readonly isCopyMode$ = this.select(({ gearset }) => gearset?.createMode === 'copy')
  public readonly isLoading$ = this.select(({ isLoading }) => isLoading)
  public readonly imageUrl$ = this.select(({ gearset }) => gearset?.imageId).pipe(
    switchMap((id) => this.imagesDb.imageUrl(id))
  )

  public constructor(
    private db: GearsetsDB,
    private imagesDb: ImagesDB,
    private itemsDb: ItemInstancesDB,
    private sanitizer: DomSanitizer
  ) {
    super({
      level: null,
      gearset: null,
      isLoading: true,
    })
  }

  /**
   * Loads given set into the form
   */
  public readonly load = this.updater((state, gearset: GearsetRecord | null) => {
    return {
      ...state,
      gearset: gearset,
      isLoading: false,
    }
  })

  /**
   * Loads a set by id
   */
  public readonly loadById = this.effect<string>((value$) => {
    return value$
      .pipe(switchMap((id) => this.db.observeByid(id)))
      .pipe(tap((gearset: GearsetRecord) => this.load(gearset)))
  })

  /**
   * Updates the name of the item and writes to database
   */
  public readonly updateName = this.effect<{ name: string }>((value$) => {
    return value$.pipe(
      switchMap(({ name }) => {
        const gearset = this.get().gearset
        return this.writeRecord({
          ...gearset,
          name: name,
        })
      })
    )
  })

  /**
   * Updates a gearset slot
   */
  public readonly updateSlot = this.effect<{ slot: string; value: string | ItemInstance }>((value$) => {
    return value$.pipe(
      switchMap(({ slot, value }) => {
        const gearset = this.get().gearset
        const slots = {
          ...(gearset.slots || {}),
        }
        if (value) {
          slots[slot] = value
        } else {
          delete slots[slot]
        }
        return this.writeRecord({
          ...gearset,
          slots: slots,
        })
      })
    )
  })

  /**
   * Updates enforced status effects
   */
  public readonly updateStatusEffect = this.effect<Array<{ id: string; stack: number }>>((value$) => {
    return value$.pipe(
      switchMap((list) => {
        const gearset = this.get().gearset
        const effects = [...(Array.isArray(gearset.enforceEffects) ? gearset.enforceEffects : [])]
        list.forEach(({ id, stack }) => {
          const index = effects.findIndex((it) => it.id === id)
          if (index >= 0) {
            effects[index] = { id, stack }
          } else {
            effects.push({ id, stack })
          }
        })
        return this.writeRecord({
          ...gearset,
          enforceEffects: effects.filter((it) => it.stack > 0),
        })
      })
    )
  })

  /**
   * Changes the createMode
   */
  public readonly updateMode = this.effect<{ mode: GearsetCreateMode }>((mode$) => {
    return mode$.pipe(
      switchMap(({ mode }) => {
        const gearset = this.get().gearset
        return this.writeRecord({
          ...gearset,
          createMode: mode,
        })
      })
    )
  })

  /**
   * Updates the assigned attributes
   */
  public readonly updateAttrs = this.effect<{ attrs: Record<AttributeRef, number> }>((value$) => {
    return value$.pipe(
      switchMap(({ attrs }) => {
        const gearset = this.get().gearset
        return this.writeRecord({
          ...gearset,
          attrs: attrs,
        })
      })
    )
  })

  /**
   * Updates a skill set
   */
  public readonly updateSkill = this.effect<{ slot: string; skill: string | SkillBuild }>((value$) => {
    return value$.pipe(
      switchMap(({ slot, skill }) => {
        const gearset = this.get().gearset
        const skills = {
          ...(gearset.skills || {}),
        }
        if (skill) {
          skills[slot] = skill
        } else {
          delete skills[slot]
        }
        return this.writeRecord({
          ...gearset,
          skills: skills,
        })
      })
    )
  })

  public readonly updateImageId = this.effect<{ imageId: string }>((value$) => {
    return value$.pipe(
      switchMap(async ({ imageId }) => {
        const gearset = this.get().gearset
        return this.writeRecord({
          ...gearset,
          imageId: imageId,
        })
      })
    )
  })

  public readonly updateImage = this.effect<{ file: File }>((value$) => {
    return value$.pipe(
      switchMap(async ({ file }) => {
        const buffer = await file.arrayBuffer()
        const gearset = this.get().gearset
        const oldId = gearset.imageId
        const result = await this.imagesDb.db.transaction('rw', this.imagesDb.table, async () => {
          if (oldId) {
            await this.imagesDb.destroy(oldId)
          }
          return this.imagesDb.create({
            id: null,
            type: file.type,
            data: buffer,
          })
        })
        return this.writeRecord({
          ...gearset,
          imageId: result.id,
        })
      })
    )
  })

  public readonly destroySet = this.effect((value$) => {
    return value$.pipe(
      switchMap(() => {
        const id = this.get().gearset.id
        return this.db.destroy(id)
      })
    )
  })

  private writeRecord(record: GearsetRecord) {
    const record$ = record.id ? from(this.db.update(record.id, record)) : of(record)
    return record$.pipe(
      tap({
        next: (value) => this.load(value),
        error: (e) => console.error(e),
      })
    )
  }
}
