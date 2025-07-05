import { TestBed } from '@angular/core/testing'
import { firstValueFrom } from 'rxjs'
import { testAppConfig } from '~/test'
import { APP_DB } from '../db'
import { SkillBuildsDB } from './skill-builds.db'
import { SkillBuildsService } from './skill-builds.service'

describe('SkillBuildsService', () => {
  let table: SkillBuildsDB
  let store: SkillBuildsService

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [testAppConfig.providers],
    }).compileComponents()
    TestBed.inject(APP_DB).dropTables()
    table = TestBed.inject(SkillBuildsDB)
    store = TestBed.inject(SkillBuildsService)
    table.create({ id: 'test1', name: 'Build without user' })
    table.create({ id: 'test2', name: 'Build with user', userId: 'user1' })
  })

  describe('read', () => {
    it('reads a record by id', async () => {
      const record = await store.read('test1')
      expect(record).toBeDefined()
      expect(record.id).toBe('test1')
    })

    it('reads record from any local user', async () => {
      const record = await store.read('test2')
      expect(record).toBeDefined()
      expect(record.id).toBe('test2')
    })
  })

  describe('observeRecord', () => {
    it('observes with `local` user id', async () => {
      const record = await firstValueFrom(store.observeRecord({ userId: 'local', id: 'test1' }))
      expect(record).toBeDefined()
      expect(record.id).toBe('test1')
    })

    it('observes with `null` user id', async () => {
      const record = await firstValueFrom(store.observeRecord({ userId: null, id: 'test1' }))
      expect(record).toBeDefined()
      expect(record.id).toBe('test1')
    })

    it('does not support foreign user ids', async () => {
      const record = await firstValueFrom(store.observeRecord({ userId: 'user1', id: 'test2' }))
      expect(record).toBeNull()
    })
  })

  describe('create', () => {
    it('creates a new record without user', async () => {
      const result = await store.create({ name: 'New Build' })
      expect(result?.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(result.syncState).toBe('pending')
      const read = await store.read(result.id)
      expect(read).toEqual(result)
    })

    it('creates a new record with user', async () => {
      const result = await store.create({ name: 'New Build', userId: 'user1' })
      expect(result?.id).toBeDefined()
      expect(result?.userId).toBe('user1')
      const read = await store.read(result.id)
      expect(read).toEqual(result)
    })
  })
})
