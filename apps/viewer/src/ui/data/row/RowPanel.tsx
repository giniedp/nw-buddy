import { For, Show } from 'solid-js'
import { Widget } from 'tweak-ui'
import { kindLabel } from '../families'
import { FieldValue } from './FieldValue'
import { createRowPanelStore, type RowPanelProps } from './RowPanel.store'
import { RowPreview } from './RowPreview'
import './RowPanel.css'

/**
 * The filled fields of a row, by what their column holds: links to the rows a reference names, the text of loc
 * keys, files to open in the browser, audio to play. On top: the row's name, icon and 3D preview.
 */
export function RowPanel(props: RowPanelProps) {
  const store = createRowPanelStore(props)

  return (
    <aside class="nw-sheet-row nw-data-row">
      <div class="nw-data-row-head">
        <Show when={store.icon()}>{(src) => <img class="nw-data-icon" src={src()} alt="" />}</Show>
        <div class="nw-data-row-title">
          <span class="nw-data-row-name">{store.title()}</span>
          <span class="nw-muted" title={store.sheet().path}>
            {store.subtitle()}
          </span>
        </div>
      </div>
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
