import type { GridOptions } from 'ag-grid-community'
import { For, Show } from 'solid-js'
import { Button } from 'tweak-ui'
import { hex, type ChunkEntry, type ChunkField, type ChunkTable } from '../../../../formats/cgf/chunks'
import { columnWidth, Grid } from '../../../common/grid'
import type { InspectModeStore } from './InspectMode.store'

/**
 * The selected chunk: its header, its fields (with links to chunks and byte ranges) and its lists
 */
export function ChunkPane(props: { chunk: ChunkEntry; inspect: InspectModeStore }) {
  const detail = () => props.inspect.detail()
  return (
    <div class="nw-chunk">
      <div class="nw-chunk-head">
        <span class="nw-chunk-title">
          {props.chunk.typeName} #{props.chunk.id}
        </span>
        <span class="nw-view-info">
          {hex(props.chunk.version)} · {props.chunk.size} B @ {props.chunk.offset}
        </span>
        <Button
          ghost
          title="Show the bytes of the chunk in Hex"
          onClick={() => props.inspect.openBytes({ heap: false, offset: props.chunk.offset, length: props.chunk.size })}
        >
          bytes
        </Button>
      </div>
      <Show when={detail()?.error}>
        <p class="nw-note">{detail()?.error}</p>
      </Show>
      <div class="nw-fields">
        <FieldList fields={detail()?.fields ?? []} inspect={props.inspect} />
      </div>
      <For each={detail()?.tables ?? []}>{(table) => <ChunkTableGrid table={table} />}</For>
    </div>
  )
}

/**
 * Fields as name / value rows, nested fields as open groups
 */
function FieldList(props: { fields: ChunkField[]; inspect: InspectModeStore }) {
  return (
    <For each={props.fields}>
      {(field) => (
        <Show when={field.children?.length} fallback={<FieldRow field={field} inspect={props.inspect} />}>
          <details class="nw-field-group" open>
            <summary class="nw-field-name">
              {field.name}
              <span class="nw-muted"> {field.value}</span>
            </summary>
            <div class="nw-field-children">
              <FieldList fields={field.children ?? []} inspect={props.inspect} />
            </div>
          </details>
        </Show>
      )}
    </For>
  )
}

/**
 * A field with its value, the chunks it links to and the bytes it describes
 */
function FieldRow(props: { field: ChunkField; inspect: InspectModeStore }) {
  return (
    <div class="nw-field">
      <span class="nw-field-name">{props.field.name}</span>
      <span class="nw-field-value" title={props.field.value}>
        {props.field.value}
        <For each={props.field.links ?? []}>
          {(id) => (
            <Show when={props.inspect.chunkById(id)}>
              {(target) => (
                <button class="nw-link" onClick={() => props.inspect.selectId(id)}>
                  → {target().typeName} #{id}
                </button>
              )}
            </Show>
          )}
        </For>
        <Show when={props.inspect.rangeOf(props.field)}>
          {(range) => (
            <button class="nw-link" onClick={() => props.inspect.openBytes(range())}>
              {range().heap ? 'heap' : 'bytes'} @ {range().offset}
            </button>
          )}
        </Show>
      </span>
    </div>
  )
}

interface TableRow {
  i: number
  cells: string[]
}

/**
 * A list of the chunk as a grid
 */
function ChunkTableGrid(props: { table: ChunkTable }) {
  return (
    <div class="nw-chunk-table">
      <div class="nw-chunk-table-name nw-muted">
        {props.table.name} ({props.table.rows.length})
      </div>
      <Grid<TableRow> class="nw-chunk-grid" options={tableOptions(props.table)} />
    </div>
  )
}

function tableOptions(table: ChunkTable): GridOptions<TableRow> {
  return {
    rowData: table.rows.map((cells, i) => ({ i, cells })),
    columnDefs: table.columns.map((name, c) => ({
      colId: String(c),
      headerName: name,
      valueGetter: (p) => p.data?.cells[c] ?? '',
      width: columnWidth(name, Math.max(...table.rows.map((r) => r[c]?.length ?? 0), 1)),
    })),
  }
}
