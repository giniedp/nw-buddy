import type { ListFile } from '../../api/browse'
import { formatBytes } from '../common/format'
import { InfoRow } from '../common/InfoRow'
import { useApp } from '../app/ViewerApp'

/**
 * What the sidebar shows about the selected file: path, type and size. Everything else is in the
 * details of an opened file.
 */
export function SelectionInfo(props: { file: ListFile }) {
  const types = useApp().assetTypes.list()
  return (
    <div class="nw-selection">
      <InfoRow label="Path" value={props.file.path} />
      <InfoRow label="Type" value={types()[props.file.type]?.label ?? ''} />
      <InfoRow label="Size" value={formatBytes(props.file.size)} />
    </div>
  )
}

/**
 * What the sidebar shows about the selected folder: its path
 */
export function FolderInfo(props: { path: string }) {
  return (
    <div class="nw-selection">
      <InfoRow label="Path" value={props.path} />
    </div>
  )
}
