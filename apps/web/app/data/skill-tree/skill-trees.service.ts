import { computed, inject, Injectable, signal } from '@angular/core'
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop'
import { catchError, combineLatest, of, switchMap } from 'rxjs'
import { BackendService } from '../backend'
import { autoSync } from '../backend/auto-sync'
import { GearsetRecord } from '../gearsets'
import { injectSkillTreesDB } from './skill-trees.db'
import { SkillTree, SkillTreeRecord } from './types'

@Injectable({ providedIn: 'root' })
export class SkillTreesService {
  private table = injectSkillTreesDB()
  private backend = inject(BackendService)
  private userId = computed(() => this.backend.session()?.id)
  private userId$ = toObservable(this.userId)
  private ready = signal(false)

  public constructor() {
    this.connect()
  }

  private connect() {
    autoSync({
      userId: this.userId$,
      local: this.table,
      remote: this.backend.privateTables.skillTrees,
    })
      .pipe(takeUntilDestroyed())
      .subscribe((stage) => {
        this.ready.set(stage === 'offline' || stage === 'syncing')
      })
  }

  public read(id: string) {
    return this.table.read(id)
  }

  public observeRecords(userId: string) {
    if (userId === 'local' || !userId) {
      return this.table.observeWhere({ userId: 'local' })
    }
    return this.userId$.pipe(
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
    return this.userId$.pipe(
      switchMap((localUserId) => {
        if (userId === 'local' || (userId || '') === (localUserId || '')) {
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
    return this.table.destroy(id)
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
