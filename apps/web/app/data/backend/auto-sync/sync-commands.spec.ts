import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { AppDb, AppDbRecord, AppDbTable } from '~/data/app-db'
import { DBT_GEARSETS } from '~/data/constants'
import { APP_DB } from '~/data/db'
import { processSyncCommands } from './sync-commands'

interface MyRecord extends AppDbRecord {
  name: string
}
describe('processSyncCommands', () => {
  let db: AppDb
  let table: AppDbTable<MyRecord>
  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    })
    db = TestBed.inject(APP_DB)
    table = db.table(DBT_GEARSETS)
    await db.dropTables()
  })

  afterEach(async () => {
    await db.dropTables()
  })

  it('creates local', async () => {
    let record = await table.read('1')
    expect(record).toBeFalsy()
    await processSyncCommands({
      commands: [
        {
          action: 'create',
          resource: 'local',
          data: { id: '1', name: 'Test Item', syncState: 'synced' },
        },
      ],
      remoteTable: null,
      localTable: table,
    })
    record = await table.read('1')
    expect(record).toEqual({
      id: '1',
      name: 'Test Item',
      syncState: 'synced',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  })

  it('updates local', async () => {
    const oldRecord = await table.create({ id: '1', name: 'Old Item', syncState: 'synced' }, { silent: true })
    let record = await table.read('1')
    expect(record).toEqual(oldRecord)

    await processSyncCommands({
      commands: [
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Test Item', syncState: 'synced' },
        },
      ],
      remoteTable: null,
      localTable: table,
    })
    record = await table.read('1')
    expect(record).toEqual({
      id: '1',
      name: 'Test Item',
      syncState: 'synced',
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  })

  it('deletes local', async () => {
    const oldRecord = await table.create({ id: '1', name: 'Old Item', syncState: 'synced' }, { silent: true })
    let record = await table.read('1')
    expect(record).toEqual(oldRecord)

    await processSyncCommands({
      commands: [
        {
          action: 'delete',
          resource: 'local',
          data: { id: '1', name: 'Test Item', syncState: 'synced' },
        },
      ],
      remoteTable: null,
      localTable: table,
    })
    record = await table.read('1')
    expect(record).toBeFalsy()
  })
})
