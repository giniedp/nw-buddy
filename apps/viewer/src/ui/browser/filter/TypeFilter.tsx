import { For, Show } from 'solid-js'
import { BoolInput, Button, Icon } from 'tweak-ui'
import svgFilter from '../../icons/filter.svg?raw'
import { createTypeFilterStore, groupLabel, type TypeFilterProps } from './TypeFilter.store'
import './TypeFilter.css'

/**
 * Picks the asset types to show. An empty selection shows every type that is not hidden (hidden
 * types are parts of other assets, e.g. split texture mips).
 */
export function TypeFilter(props: TypeFilterProps) {
  const store = createTypeFilterStore(props)
  let popover!: HTMLDivElement
  let anchor!: HTMLDivElement

  // below the button, inside the window
  const toggle = () => {
    const rect = anchor.getBoundingClientRect()
    popover.style.top = `${rect.bottom + 4}px`
    popover.togglePopover()
    popover.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - popover.offsetWidth - 4))}px`
  }

  return (
    <div class="nw-type-filter" ref={anchor}>
      <Button square accent={store.active()} title={store.title()} icon={<Icon svg={svgFilter} />} onClick={toggle} />
      <div ref={popover} popover="auto" class="nw-type-popover">
        <div class="nw-type-actions">
          <Button ghost disabled={!store.active()} onClick={store.clear}>
            All types
          </Button>
        </div>
        <For each={store.groups()}>
          {(group) => (
            <div class="nw-type-group">
              <label class="nw-type-row nw-type-group-head">
                <BoolInput value={store.isGroupSelected(group)} onInput={(on) => store.setGroup(group, on)} />
                <span>{groupLabel(group.group)}</span>
                <span class="nw-type-count">{group.count.toLocaleString()}</span>
              </label>
              <For each={group.entries}>
                {(entry) => (
                  <label class="nw-type-row">
                    <BoolInput value={store.isSelected(entry.index)} onInput={(on) => store.setType(entry.index, on)} />
                    <span classList={{ 'nw-muted': !entry.type.known }}>{entry.type.label}</span>
                    <span class="nw-type-count">{entry.type.count.toLocaleString()}</span>
                  </label>
                )}
              </For>
            </div>
          )}
        </For>
        <Show when={props.types.length === 0}>
          <p class="nw-note">No types yet</p>
        </Show>
      </div>
    </div>
  )
}
