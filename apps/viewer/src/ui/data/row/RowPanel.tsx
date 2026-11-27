import { For } from 'solid-js'
import { Widget } from 'tweak-ui'
import { kindLabel } from '../families'
import { FieldValue } from './FieldValue'
import { createRowPanelStore, type RowPanelProps } from './RowPanel.store'
import { RowPreview } from './RowPreview'
import './RowPanel.css'

/**
 * The filled fields of a row, by what their column holds: links to the rows a reference names, the text of loc
 * keys, files to open in the browser, audio to play. On top: the row's 3D preview.
 */
export function RowPanel(props: RowPanelProps) {
  const store = createRowPanelStore(props)

  return (
    <aside class="nw-sheet-row nw-data-row">
      <div class="nw-sheet-fields">
        <RowPreview rows={props.rows} row={props.row} shown={props.shown} />
        <For each={store.fields()}>
          {(field) => (
            <Widget
              label={
                <span title={field.column.kind ? kindLabel(field.column.kind, field.column.refs) : undefined}>
                  {field.column.name}
                </span>
              }
            >
              <FieldValue column={field.column} text={field.text} from={store.from()} />
            </Widget>
          )}
        </For>
      </div>
    </aside>
  )
}
