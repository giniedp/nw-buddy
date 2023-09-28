import { Injectable } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { ComponentStore } from '@ngrx/component-store'
import { AttributeRef, ItemPerkInfo, PerkBucket, getItemPerkInfos } from '@nw-data/common'
import { Observable, combineLatest, from, map, of, switchMap, tap } from 'rxjs'

import { ItemDefinitionMaster, Perks } from '@nw-data/generated'
import { NwDbService } from '~/nw'
import { combineLatestOrEmpty } from '~/utils/combine-latest-or-empty'
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
    private itemDb: ItemInstancesDB,
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

  public readonly updateSlots = this.effect<{
    slots: Array<{ slot: string; gearScore?: number; perks?: Array<{ perkId: string; key: string }> }>
  }>((value$) => {
    return value$.pipe(
      switchMap(({ slots }) => {
        const gearset: Readonly<GearsetRecord> = this.get<Readonly<GearsetRecord>>(({ gearset }) => gearset)
        const newRecord: GearsetRecord = cloneRecord(gearset)

        for (const { slot, gearScore, perks } of slots) {
          const { instance, instanceId } = decodeSlot(gearset.slots[slot])
          if (instance) {
            newRecord.slots[slot] = mergeItemInstance(instance, { gearScore, perks })
          } else if (instanceId) {
            this.itemDb.read(instanceId).then((record) => {
              const toUpdate = mergeItemInstance(record, { gearScore, perks })
              return this.itemDb.update(instanceId, toUpdate)
            })
          }
        }
        return this.writeRecord(newRecord)
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

function decodeSlot(slot: string | ItemInstance) {
  const instanceId = typeof slot === 'string' ? slot : null
  const instance = typeof slot !== 'string' ? slot : null
  return {
    instanceId,
    instance,
  }
}

export function resolveSlotItemInstance(
  slot: string | ItemInstance,
  itemDB: ItemInstancesDB
): Observable<ItemInstance> {
  const { instance, instanceId } = decodeSlot(slot)
  return instanceId ? itemDB.live((t) => t.get(instanceId)) : of(instance)
}

export function resolveGearsetSlotInstances(record: GearsetRecord, itemDB: ItemInstancesDB) {
  return combineLatestOrEmpty(
    Object.entries(record.slots).map(([slot, instance]) => {
      return combineLatest({
        slot: of(slot),
        instanceId: of(typeof instance === 'string' ? instance : null),
        instance: resolveSlotItemInstance(instance, itemDB),
      })
    })
  )
}

export interface ResolvedGersetSlotItem {
  slot: string
  instance: ItemInstance
  item: ItemDefinitionMaster
  perks: ResolvedItemPerkInfo[]
}
export interface ResolvedItemPerkInfo extends ItemPerkInfo {
  bucket: PerkBucket
  perk: Perks
}
export function resolveGearsetSlotItems(record: GearsetRecord, itemDB: ItemInstancesDB, db: NwDbService) {
  return combineLatest({
    slots: resolveGearsetSlotInstances(record, itemDB),
    items: db.itemsMap,
    perks: db.perksMap,
    buckets: db.perkBucketsMap,
  }).pipe(
    map(({ slots, items, perks, buckets }): ResolvedGersetSlotItem[] => {
      return slots.map(({ slot, instance }): ResolvedGersetSlotItem => {
        const item = items.get(instance?.itemId)
        return {
          slot,
          instance,
          item,
          perks: getItemPerkInfos(item, instance.perks).map((it): ResolvedItemPerkInfo => {
            return {
              ...it,
              bucket: buckets.get(it.bucketId),
              perk: perks.get(it.perkId),
            }
          }),
        }
      })
    })
  )
}

function mergeItemInstance(
  record: ItemInstance,
  next: { gearScore?: number; perks?: Array<{ perkId: string; key: string }> }
) {
  const toUpdate: ItemInstance = cloneRecord(record)
  if (next?.gearScore) {
    toUpdate.gearScore = next?.gearScore
  }
  if (next?.perks) {
    for (const { key, perkId } of next.perks) {
      if (perkId) {
        toUpdate.perks[key] = perkId
      } else {
        delete toUpdate.perks[key]
      }
    }
  }
  return toUpdate
}

function cloneRecord<T>(item: T): T {
  return JSON.parse(JSON.stringify(item))
}
