import { AppDbRecord, AppDbTable } from '~/data/app-db'
import { PrivateTable } from '../backend-adapter'

export async function syncInitial<T extends AppDbRecord>(localTable: AppDbTable<T>, remoteTable: PrivateTable<T>) {
  const remoteRows = await remoteTable.list()
  const localRows = await localTable.list()

  const pairs: Array<{
    local: T | null
    remote: T | null
  }> = []

  for (const row of localRows) {
    pairs.push({
      local: row,
      remote: remoteRows.find((remote) => remote.id === row.id),
    })
  }

  for (const remote of remoteRows) {
    const found = localRows.find((local) => local.id === remote.id)
    if (!found) {
      pairs.push({
        local: null,
        remote: remote,
      })
    }
  }

  const promises = pairs.map(async ({ local, remote }): Promise<void> => {
    if (local == null && remote != null) {
      // Handle case where only remote row exists
      await localTable.create(remote, { silent: true })
      return
    }

    if (local != null && remote == null) {
      // Handle case where only local row exists
      await remoteTable.create(local)
      return
    }

    // TODO:
    // // Handle case where both local and remote rows exist
    // if (!('updated_at' in local)) {
    //   return
    // }

    // const localDate = new Date(local.updated_at as string)
    // const remoteDate = new Date(remote.updated_at)

    // // Compare timestamps or perform sync logic
    // if (remoteDate < localDate) {
    //   console.log('LOCAL IS AHEAD OF REMOTE')
    //   await client
    //     .from(tableName)
    //     .update(local as TablesUpdate<TableNames>)
    //     .eq('id', local.id)

    //   return
    // }
    // if (localDate < remoteDate) {
    //   console.log('REMOTE IS AHEAD OF LOCAL')
    //   console.log('local:', local)
    //   console.log('remote:', remote)
    //   await table.update(local.id, remote, { silent: true })
    //   return
    // }
  })

  await Promise.all(promises)
}
