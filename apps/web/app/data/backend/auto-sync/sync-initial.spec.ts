import { AppDbRecord } from '~/data/app-db'
import { createInitialSyncCommands, resolveInitialSyncPairs } from './sync-initial'

interface MyRecord extends AppDbRecord {
  name: string
}

describe('resolvSyncCommand', () => {
  describe('remote exists, local missing', () => {
    it('creates local', () => {
      const local: MyRecord = null
      const remote: MyRecord = { id: '1', name: 'Remote Item' }
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'create',
          resource: 'local',
          data: { id: '1', name: 'Remote Item', sync_state: 'synced' },
        },
      ])
    })
  })

  describe('local exists, remote missing or deleted', () => {
    it('sync_state = null, creates remote', () => {
      const local: MyRecord = { id: '1', name: 'Local Item' }
      const remote: MyRecord = null
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'create',
          resource: 'remote',
          data: { id: '1', name: 'Local Item', sync_state: 'synced' },
        },
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Local Item', sync_state: 'synced' },
        },
      ])
    })

    it('sync_state = empty, creates remote', () => {
      const local: MyRecord = { id: '1', name: 'Local Item', sync_state: '' as any }
      const remote: MyRecord = null as any
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'create',
          resource: 'remote',
          data: { id: '1', name: 'Local Item', sync_state: 'synced' },
        },
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Local Item', sync_state: 'synced' },
        },
      ])
    })

    it('sync_state = pending, creates remote', () => {
      const local: MyRecord = { id: '1', name: 'Local Item', sync_state: 'pending' }
      const remote: MyRecord = null
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'create',
          resource: 'remote',
          data: { id: '1', name: 'Local Item', sync_state: 'synced' },
        },
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Local Item', sync_state: 'synced' },
        },
      ])
    })

    it('sync_state = synced, deletes local', () => {
      const local: MyRecord = { id: '1', name: 'Local Item', sync_state: 'synced' }
      const remote: MyRecord = null
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'delete',
          resource: 'local',
          data: { id: '1', name: 'Local Item', sync_state: 'synced' },
        },
      ])
    })

    it('sync_state = conflict, keeps conflict', () => {
      const local: MyRecord = { id: '1', name: 'Local Item', sync_state: 'conflict' }
      const remote: MyRecord = null
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Local Item', sync_state: 'conflict' },
        },
      ])
    })

    it('sync_state = anything, keeps conflict', () => {
      const local: MyRecord = { id: '1', name: 'Local Item', sync_state: 'anything' as any }
      const remote: MyRecord = null
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Local Item', sync_state: 'conflict' },
        },
      ])
    })
  })

  describe('both exist, local is newer', () => {
    it('updates remote', () => {
      const local: MyRecord = { id: '1', name: 'Local Item', sync_state: 'any' as any, updated_at: '2' }
      const remote: MyRecord = { id: '1', name: 'Remote Item', sync_state: null, updated_at: '1' }
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'update',
          resource: 'remote',
          data: { id: '1', name: 'Local Item', sync_state: 'synced', updated_at: '2' },
        },
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Local Item', sync_state: 'synced', updated_at: '2' },
        },
      ])
    })
  })

  describe('both exist, remote is newer', () => {
    it('updates remote', () => {
      const local: MyRecord = { id: '1', name: 'Local Item', sync_state: null as any, updated_at: '1' }
      const remote: MyRecord = { id: '1', name: 'Remote Item', sync_state: 'any' as any, updated_at: '2' }
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([
        {
          action: 'update',
          resource: 'local',
          data: { id: '1', name: 'Remote Item', sync_state: 'synced', updated_at: '2' },
        },
      ])
    })
  })

  describe('both exist, same age', () => {
    it('does nothing', () => {
      const local: MyRecord = { id: '1', name: 'Local Item', sync_state: null as any, updated_at: '1' }
      const remote: MyRecord = { id: '1', name: 'Remote Item', sync_state: 'any' as any, updated_at: '1' }
      const commands = createInitialSyncCommands(local, remote)
      expect(commands).toEqual([])
    })
  })
})

describe('resolveInitialSyncPairs', () => {
  it('local only', () => {
    const result = resolveInitialSyncPairs<MyRecord>({
      localRows: [{ id: '1', name: 'Local Item' }],
      remoteRows: [],
    })
    expect(result).toEqual([
      {
        local: { id: '1', name: 'Local Item' },
        remote: null,
      },
    ])
  })

  it('remote only', () => {
    const result = resolveInitialSyncPairs<MyRecord>({
      localRows: [],
      remoteRows: [{ id: '1', name: 'Remote Item' }],
    })
    expect(result).toEqual([
      {
        local: null,
        remote: { id: '1', name: 'Remote Item' },
      },
    ])
  })

  it('local and remote with no match', () => {
    const result = resolveInitialSyncPairs<MyRecord>({
      localRows: [{ id: '1', name: 'Local Item' }],
      remoteRows: [{ id: '2', name: 'Remote Item' }],
    })
    expect(result).toEqual([
      {
        local: { id: '1', name: 'Local Item' },
        remote: null,
      },
      {
        local: null,
        remote: { id: '2', name: 'Remote Item' },
      },
    ])
  })

  it('local and remote with matches', () => {
    const result = resolveInitialSyncPairs<MyRecord>({
      localRows: [{ id: '1', name: 'Local Item' }],
      remoteRows: [{ id: '1', name: 'Remote Item' }],
    })
    expect(result).toEqual([
      {
        local: { id: '1', name: 'Local Item' },
        remote: { id: '1', name: 'Remote Item' },
      },
    ])
  })
})
