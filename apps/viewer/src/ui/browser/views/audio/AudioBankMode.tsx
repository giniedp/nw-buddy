import type { ColDef, GridOptions } from 'ag-grid-community'
import { Match, Show, Switch } from 'solid-js'
import { TextInput } from 'tweak-ui'
import { formatBytes } from '../../../common/format'
import { columnWidth, Grid } from '../../../common/grid'
import type { BankMedia } from '../../../../audio/preview'
import type { AssetViewProps } from '../registry'
import { createAudioBankModeStore, type AudioBankModeStore } from './AudioBankMode.store'
import { formatDuration } from './playback'
import { PlayingInfo } from './PlayingInfo'
import './AudioBankMode.css'

/**
 * A `.bnk` sound bank: its embedded and streamed media, each one plays (decoded with vgmstream). Loaded with `lazy()`,
 * ag-grid loads with it.
 */
export default function AudioBankMode(props: AssetViewProps) {
  const store = createAudioBankModeStore(props)
  const { state } = store

  return (
    <Switch
      fallback={
        <div class="nw-empty">
          <p class="nw-note">Reading…</p>
        </div>
      }
    >
      <Match when={state.loadError}>
        <div class="nw-empty">
          <p class="nw-note">The bank could not be read: {state.loadError}</p>
        </div>
      </Match>
      <Match when={state.ready}>
        <div class="nw-view-bar">
          <TextInput class="nw-view-filter" placeholder="Filter events and ids" onInput={store.filter} />
          <span class="nw-view-info">{state.info}</span>
          <PlayingInfo playback={store.playback} />
        </div>
        <Show
          when={!state.empty}
          fallback={
            <div class="nw-empty">
              <p class="nw-note">The bank holds no media of its own.</p>
            </div>
          }
        >
          <Grid<BankMedia> ref={store.setGrid} options={gridOptions(store)} />
        </Show>
      </Match>
    </Switch>
  )
}

function gridOptions(store: AudioBankModeStore): GridOptions<BankMedia> {
  return {
    rowData: store.rows(),
    columnDefs: columns(store),
    defaultColDef: { sortable: true, resizable: true },
    // the button columns are as wide as their rendered buttons
    onFirstDataRendered: (e) => e.api.autoSizeColumns(['play', 'export'], false),
  }
}

function columns(store: AudioBankModeStore): ColDef<BankMedia>[] {
  return [
    {
      colId: 'play',
      headerName: '',
      sortable: false,
      cellClass: 'nw-ag-buttons',
      cellRenderer: (p: { data: BankMedia }) => {
        const button = document.createElement('button')
        const error = store.errorOf(p.data)
        button.className = 'twk-btn twk-btn-sm nw-audio-play'
        button.textContent = store.isPlaying(p.data) ? '■' : '▶'
        button.title = error ?? 'Play'
        button.classList.toggle('nw-error', !!error)
        button.onclick = () => store.toggle(p.data)
        return button
      },
    },
    { field: 'id', headerName: 'Media id', width: columnWidth('Media id', 10) },
    { field: 'kind', headerName: 'Kind', width: columnWidth('Kind', 8) },
    {
      field: 'size',
      headerName: 'Size',
      width: columnWidth('Size', 9),
      type: 'rightAligned',
      valueFormatter: (p) => (p.value ? formatBytes(p.value) : ''),
    },
    {
      colId: 'duration',
      headerName: 'Duration',
      width: columnWidth('Duration', 8),
      type: 'rightAligned',
      valueGetter: (p) => store.durationOf(p.data!),
      valueFormatter: (p) => (p.value == null ? '' : formatDuration(p.value)),
    },
    {
      colId: 'export',
      headerName: 'Export',
      sortable: false,
      cellClass: 'nw-ag-buttons',
      cellRenderer: (p: { data: BankMedia }) => {
        const cell = document.createDocumentFragment()
        for (const format of ['wav', 'wem'] as const) {
          const button = document.createElement('button')
          const title = `Save as .${format}`
          button.className = 'twk-btn twk-btn-sm nw-audio-action'
          button.textContent = format
          button.title = title
          button.onclick = async () => {
            button.disabled = true
            const error = await store.save(p.data, format)
            button.title = error ?? title
            button.classList.toggle('nw-error', !!error)
            button.disabled = false
          }
          cell.append(button)
        }
        return cell
      },
    },
    {
      colId: 'events',
      headerName: 'Event',
      flex: 2,
      valueGetter: (p) => p.data!.events.join(', '),
      tooltipValueGetter: (p) => p.data!.events.join('\n'),
    },
    { field: 'path', headerName: 'File', flex: 1, tooltipField: 'path' },
  ]
}
