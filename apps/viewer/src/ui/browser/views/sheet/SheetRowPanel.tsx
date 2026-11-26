import { For } from 'solid-js'
import { Button, Icon } from 'tweak-ui'
import { InfoRow } from '../../../common/InfoRow'
import svgXmark from '../../../icons/xmark.svg?raw'
import type { SheetField } from './types'

/**
 * The filled fields of one row of the sheet, next to the grid
 */
export function SheetRowPanel(props: { row: number; fields: SheetField[]; onClose: () => void }) {
  return (
    <aside class="nw-sheet-row">
      <div class="nw-view-bar">
        <span>Row {props.row}</span>
        <span class="nw-muted">{props.fields.length} filled fields</span>
        <Button ghost square class="nw-push-end" title="Close" icon={<Icon svg={svgXmark} />} onClick={props.onClose} />
      </div>
      <div class="nw-sheet-fields">
        <For each={props.fields}>{(field) => <InfoRow label={field.name} value={field.text} />}</For>
      </div>
    </aside>
  )
}
