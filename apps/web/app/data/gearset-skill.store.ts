import { Injectable } from '@angular/core'
import { ComponentStore } from '@ngrx/component-store'
import { from, map, of, switchMap, tap } from 'rxjs'
import { GearsetRecord, GearsetsDB } from './gearsets.db'
import { SkillBuild, SkillBuildsDB } from './skill-builds.db'

export type GearsetSkillSlot = 'primary' | 'secondary'
export interface GearsetSkillState {
  gearset: GearsetRecord
  instanceId: string
  instance: SkillBuild
  slot: GearsetSkillSlot
}

@Injectable()
export class GearsetSkillStore extends ComponentStore<GearsetSkillState> {
  public readonly instanceId$ = this.select(({ instanceId }) => instanceId)
  public readonly instance$ = this.select(({ instance }) => instance)
  public readonly slot$ = this.select(({ slot }) => slot)
  public readonly canRemove$ = this.select(({ instanceId, instance }) => !!instanceId || !!instance)
  public readonly canBreak$ = this.select(({ instanceId }) => !!instanceId)

  public constructor(private skillsDB: SkillBuildsDB, private gearDb: GearsetsDB) {
    super({
      gearset: null,
      instanceId: null,
      instance: null,
      slot: null,
    })
  }

  public readonly useSlot = this.effect<{ gearset: GearsetRecord; slot: GearsetSkillSlot }>((value$) => {
    return value$.pipe(
      switchMap(({ gearset, slot }) => {
        const slotItem = gearset?.skills?.[slot]
        const instanceId = typeof slotItem === 'string' ? slotItem : null
        const instance = typeof slotItem !== 'string' ? slotItem : null
        const query$ = instanceId ? this.skillsDB.live((t) => t.get(instanceId)) : of(instance)
        return query$
          .pipe(
            map((instance) => {
              return {
                gearset,
                slot,
                instanceId,
                instance,
              }
            })
          )
          .pipe(
            tap({
              next: (state) => this.setState(state),
              error: (err) => console.error(err),
            })
          )
      })
    )
  })

  /**
   * Updates a skill slot
   */
  public readonly updateSlot = this.effect<{ instance?: SkillBuild; instanceId?: string }>((value$) => {
    return value$.pipe(
      switchMap(({ instance, instanceId }) => {
        const gearset = this.get().gearset
        const slot = this.get().slot

        const record = makeCopy(gearset)
        record.skills = record.skills || {}
        if (!instanceId && !instance) {
          delete record.skills[slot]
        } else if (instanceId) {
          record.skills[slot] = instanceId
        } else {
          record.skills[slot] = instance
        }
        return this.writeRecord(record)
      })
    )
  })

  private writeRecord(record: GearsetRecord) {
    return from(this.gearDb.update(record.id, record)).pipe(
      tap({
        next: (value) => this.useSlot({ gearset: value, slot: this.get().slot }),
        error: (e) => console.error(e),
      })
    )
  }
}

function makeCopy<T>(it: T): T {
  return JSON.parse(JSON.stringify(it))
}
