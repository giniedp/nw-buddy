import { computed, inject, Injectable, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { catchError, combineLatest, distinctUntilChanged, map, NEVER, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { GearsetRecord } from '../gearsets/types'
import { injectSkillTreesDB } from './skill-trees.db'
import { SkillTree, SkillTreeRecord } from './types'
import { LOCAL_USER_ID } from '../constants'

@Injectable({ providedIn: 'root' })
export class SkillTreesService {
  public readonly table = injectSkillTreesDB()
  private backend = inject(BackendService)
  private userId = this.backend.sessionUserId
  private userId$ = toObservable(this.userId)
  private online$ = toObservable(this.backend.isOnline)
  private ready = signal(false)
  private ready$ = toObservable(this.ready)

  public constructor() {
    this.sync()
  }

  public sync = rxMethod<void>((source) => {
    return source.pipe(
      switchMap(() => {
        return autoSync({
          userId: this.userId$,
          online: this.online$,
          local: this.table,
          remote: this.backend.privateTables.skillTrees,
        })
      }),
      map((stage) => this.ready.set(stage === 'offline' || stage === 'syncing')),
    )
  })

  public read(id: string) {
    return this.table.read(id)
  }

  public observeCount(userId: string) {
    userId ||= LOCAL_USER_ID
    return this.table.observeWhereCount({ userId })
  }

  public observeRecords(userId: string) {
    userId ||= LOCAL_USER_ID
    if (userId === LOCAL_USER_ID) {
      return this.table.observeWhere({ userId })
    }
    return this.ready$.pipe(
      switchMap((ready) => (ready ? this.userId$ : NEVER)),
      distinctUntilChanged(),
      switchMap((localUserId) => {
        if (userId === localUserId) {
          return this.table.observeWhere({ userId: localUserId })
        }
        if (this.backend.isEnabled()) {
          // TODO:
          // return ...
        }
        return of<SkillTreeRecord[]>([])
      }),
    )
  }

  public observeRecord({ userId, id }: { userId: string; id: string }) {
    userId ||= LOCAL_USER_ID
    if (userId === LOCAL_USER_ID) {
      return this.table.observeById(id)
    }
    return this.userId$.pipe(
      switchMap((localUserId) => {
        if (userId === localUserId) {
          return this.table.observeById(id)
        }
        if (this.backend.isEnabled()) {
          return this.backend.publicTables.skillSets.read({ user: userId, id })
        }
        return of(null)
      }),
      catchError((error) => {
        console.error('Error observing skill build record:', error)
        return of(null)
      }),
    )
  }

  public resolveGearsetSkill(skill: string | SkillTree) {
    if (typeof skill === 'string') {
      return this.table.observeById(skill)
    }
    return of(skill)
  }
  public resolveGearsetSkills(skills: GearsetRecord['skills']) {
    return combineLatest({
      primary: this.resolveGearsetSkill(skills?.['primary']),
      secondary: this.resolveGearsetSkill(skills?.['secondary']),
    })
  }

  public create(record: Partial<SkillTreeRecord>) {
    return this.table.create({
      ...record,
      id: record.id ?? this.table.createId(),
      syncState: 'pending',
      createdAt: new Date().toJSON(),
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public dublicate(record: SkillTreeRecord) {
    return this.create({
      ...record,
      id: null,
      ipnsKey: null,
      ipnsName: null,
      status: 'private',
    })
  }

  public update(id: string, record: Partial<SkillTreeRecord>) {
    return this.table.update(id, {
      ...record,
      id,
      syncState: 'pending',
      updatedAt: new Date().toJSON(),
      userId: this.userId() || 'local',
    })
  }

  public delete(id: string) {
    return this.table.delete(id)
  }

  public async deleteUserData(userId: string) {
    const records = await this.table.where({ userId })
    return this.table.delete(records.map((it) => it.id))
  }

  public publish(record: SkillTreeRecord) {
    return this.update(record.id, {
      ...record,
      status: 'public',
    })
  }

  public unpublish(record: SkillTreeRecord) {
    return this.update(record.id, {
      ...record,
      status: 'private',
      // TODO: reset ipns fields?
      // ipnsKey: null,
      // ipnsName: null,
    })
  }
}
