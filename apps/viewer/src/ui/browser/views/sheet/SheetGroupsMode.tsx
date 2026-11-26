import type { SheetGroups } from '../../../../formats/datasheet/analysis'
import type { AssetViewProps } from '../registry'
import { groupColumns } from './columns'
import type { SheetData } from './sheet'
import { SheetLayout } from './SheetLayout'

/**
 * The unpivot of a wide sheet: one row per group and sheet row with a filled field. The keys of the sheet row,
 * the group number and name, then one column per field of the group. Loaded lazily, ag-grid loads with it.
 */
export default function SheetGroupsMode(props: AssetViewProps) {
  return <SheetGroupsView data={props.ctx.sheet} />
}

/**
 * The groups view of a wide sheet, also used by the Data tool (ui/data) for wide families such as LootBuckets
 */
export function SheetGroupsView(props: { data: SheetData }) {
  // the sheet does not change while the view lives, it is read once
  const data = props.data
  const entries = data.groups.entries
  return (
    <SheetLayout
      data={data}
      rows={entries.length}
      columns={groupColumns(data)}
      sourceRow={(i) => entries[i][1]}
      count={groupsCount(data.groups)}
    />
  )
}

export function groupsCount(groups: Pick<SheetGroups, 'entries' | 'numbers'>) {
  return `${groups.entries.length.toLocaleString()} entries in ${groups.numbers.length.toLocaleString()} groups`
}
