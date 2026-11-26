import { For, Show } from 'solid-js'
import { Group } from 'tweak-ui'
import { InfoRow } from '../../../common/InfoRow'
import type { AssetViewProps } from '../registry'
import { createDetailsViewStore } from './DetailsView.store'
import './DetailsView.css'

/**
 * Everything the archive and the catalog know about a file, for looking it up. Nothing here is needed to work
 * with the file, so the other views do not repeat it.
 */
export function DetailsView(props: AssetViewProps) {
  const { state } = createDetailsViewStore(props)
  return (
    <div class="nw-details">
      <Group title="File">
        <For each={state.file}>{(row) => <InfoRow label={row.label} value={row.value} />}</For>
      </Group>
      <Group title="Catalog">
        <Show when={state.catalog} fallback={<p class="nw-note">Not in the catalog</p>}>
          {(rows) => <For each={rows()}>{(row) => <InfoRow label={row.label} value={row.value} />}</For>}
        </Show>
      </Group>
      <Show when={state.parts.length}>
        <Group title="Split parts">
          <For each={state.parts}>{(row) => <InfoRow label={row.label} value={row.value} />}</For>
        </Group>
      </Show>
    </div>
  )
}
