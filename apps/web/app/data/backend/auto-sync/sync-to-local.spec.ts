import { AppDbRecord } from '~/data/app-db'
import { createSyncToLocalCommands } from './sync-to-local'

interface MyRecord extends AppDbRecord {
  name: string
}
describe('createSyncToLocalCommands', () => {
  describe('delete, local missing', () => {
    it('noop', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'delete',
          record: { id: '1', name: 'Test Item' },
        },
        null,
      )

      expect(commands).toEqual([])
    })
  })

  describe('delete, local exists', () => {
    it('deletes local', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'delete',
          record: { id: '1', name: 'Test Item' },
        },
        { id: '1', name: 'Test Item', syncState: 'synced' },
      )

      expect(commands).toEqual([
        {
          action: 'delete',
          resource: 'local',
          data: { id: '1', name: 'Test Item', syncState: 'synced' },
        },
      ])
    })

    it('deletes local in any state', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'delete',
          record: { id: '1', name: 'Test Item' },
        },
        { id: '1', name: 'Test Item', syncState: 'any' as any },
      )

      expect(commands).toEqual([
        {
          action: 'delete',
          resource: 'local',
          data: { id: '1', name: 'Test Item', syncState: 'any' as any },
        },
      ])
    })
  })

  describe('create, local missing', () => {
    it('creates local item', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'create',
          record: { id: '1', name: 'Test Item' },
        },
        null,
      )

      expect(commands).toEqual([
        {
          action: 'create',
          resource: 'local',
          data: { id: '1', name: 'Test Item', syncState: 'synced' },
        },
      ])
    })
  })

  describe('create, local exists', () => {
    it('marks local as conflict', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'create',
          record: { id: '1', name: 'Test Item' },
        },
        { id: '1', name: 'Existing Item', syncState: 'synced' },
      )

      expect(commands).toEqual([
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Existing Item', syncState: 'conflict' },
        },
      ])
    })
  })

  describe('update, local missing', () => {
    it('creates local item', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'update',
          record: { id: '1', name: 'Test Item' },
        },
        null,
      )

      expect(commands).toEqual([
        {
          action: 'create',
          resource: 'local',
          data: { id: '1', name: 'Test Item', syncState: 'synced' },
        },
      ])
    })
  })

  describe('update, local is olader', () => {
    it('creates local item', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'update',
          record: { id: '1', name: 'Test Item', updatedAt: new Date('2023-01-01').toJSON() },
        },
        { id: '1', name: 'Old Item', syncState: 'synced', updatedAt: new Date('2022-12-31').toJSON() },
      )

      expect(commands).toEqual([
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Test Item', syncState: 'synced', updatedAt: new Date('2023-01-01').toJSON() },
        },
      ])
    })
  })

  describe('update, local is newer', () => {
    it('marks as conflicted', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'update',
          record: { id: '1', name: 'Test Item', updatedAt: new Date('2022-01-01').toJSON() },
        },
        { id: '1', name: 'Old Item', syncState: 'synced', updatedAt: new Date('2023-12-31').toJSON() },
      )

      expect(commands).toEqual([
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Old Item', syncState: 'conflict', updatedAt: new Date('2023-12-31').toJSON() },
        },
      ])
    })
  })

  describe('update, local is same age', () => {
    it('marks as conflicted', () => {
      const commands = createSyncToLocalCommands<MyRecord>(
        {
          type: 'update',
          record: { id: '1', name: 'Test Item', updatedAt: new Date('2023-01-01').toJSON() },
        },
        { id: '1', name: 'Old Item', syncState: 'synced', updatedAt: new Date('2023-12-31').toJSON() },
      )

      expect(commands).toEqual([
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Old Item', syncState: 'conflict', updatedAt: new Date('2023-12-31').toJSON() },
        },
      ])
    })
  })
})
