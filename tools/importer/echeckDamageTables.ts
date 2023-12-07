
export function checkDamageTables(tables: Array<{ file: string, data: any }>) {
  const ids = new Map<string, number>()
  tables
    .filter((it) => it.file.includes('_damagetable'))
    .forEach((table) => {
      table.data.forEach((row) => {
        const id = row.DamageID
        if (!ids.has(id)) {
          ids.set(id, 0)
        }
        ids.set(id, ids.get(id) + 1)
      })
    })

  const relevant = new Map<string, number>()
  tables.filter((it) => it.file.includes('_ability')).forEach((table) => {
    table.data.forEach((row) => {
      let rows = row.DamageTableRow || []
      rows.forEach((id: string) => {
        relevant.set(id, ids.get(id))
      })
      rows = row.DamageTableRowOverride || []
      rows.forEach((id: string) => {
        relevant.set(id, ids.get(id))
      })
    })
  })

  Array.from(relevant.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([id, count]) => count > 1)
    .map(([id, count]) => {
      console.log(`${count} ${id}`)
    })
}
