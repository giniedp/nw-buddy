import { EquipSlotId } from '@nw-data/common'
import { Observable, combineLatest, of } from 'rxjs'
import { combineLatestOrEmpty } from '~/utils'
import { ItemInstance, ItemInstancesDB } from '../items'
import { SkillSet } from '../skillbuilds'
import { SkillBuildsDB } from '../skillbuilds/skill-builds.db'
import { GearsetRecord } from './types'

export function resolveGearsetSkills(db: SkillBuildsDB, skills: GearsetRecord['skills']) {
  return combineLatest({
    primary: resolveGearsetSkill(db, skills?.['primary']),
    secondary: resolveGearsetSkill(db, skills?.['secondary']),
  })
}

export function resolveGearsetSkill(db: SkillBuildsDB, skill: string | SkillSet) {
  if (typeof skill === 'string') {
    return db.observeByid(skill)
  }
  return of(skill)
}

export interface ResolvedGearsetSlot {
  slot: EquipSlotId
  instanceId: string
  instance: ItemInstance
}

export function resolveGearsetSlots(db: ItemInstancesDB, slots: GearsetRecord['slots']) {
  return combineLatestOrEmpty(
    Object.entries(slots || {}).map(([slot, instance]): Observable<ResolvedGearsetSlot> => {
      return resolveGearsetSlot(db, slot as EquipSlotId, instance)
    }),
  )
}

export function resolveGearsetSlot(db: ItemInstancesDB, slotId: EquipSlotId, instance: string | ItemInstance) {
  if (typeof instance === 'string') {
    return combineLatest({
      slot: of(slotId),
      instanceId: of(instance),
      instance: db.observeByid(instance),
    })
  }
  return combineLatest({
    slot: of(slotId),
    instanceId: of<string>(null),
    instance: of(instance),
  })
}
