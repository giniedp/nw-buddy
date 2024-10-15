import { MountData } from '@nw-data/generated'
import { TableGridUtils } from '~/ui/data/table-grid'

export type MountTableUtils = TableGridUtils<MountTableRecord>
export type MountTableRecord = MountData & {
  $source?: string
}
