import { For, Show, createEffect } from 'solid-js'
import { hitShapeLabel } from '../../../game/character/mannequin/hitShape'
import { barTimes, createTrackBarStore, paramEntries } from './TrackBar.store'
import type { TrackBarProps } from './types'
import './TrackBar.css'

/**
 * The procedural layers of a playing fragment as rows of bars (damage, spells, homing, …) with a playhead: the bars
 * that run at the time stand out, a bar's details (type, params, a link) show on hover. Click or drag on the track
 * seeks when the host allows it, a double click plays the fragment again.
 */
export function TrackBar(props: TrackBarProps) {
  const store = createTrackBarStore(props)
  const { state } = store
  let track!: HTMLDivElement
  let details!: HTMLDivElement
  // the element of the hovered bar, the details show above it
  let anchor: HTMLElement | null = null

  const fraction = (event: PointerEvent) => {
    const rect = track.getBoundingClientRect()
    return rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0
  }

  // above the bar, inside the window
  createEffect(() => {
    const item = store.hovered()
    if (!item || !anchor) {
      if (details.matches(':popover-open')) {
        details.hidePopover()
      }
      return
    }
    if (!details.matches(':popover-open')) {
      details.showPopover()
    }
    const rect = anchor.getBoundingClientRect()
    const top = rect.top - details.offsetHeight - 4
    details.style.top = `${top < 4 ? rect.bottom + 4 : top}px`
    details.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - details.offsetWidth - 4))}px`
  })

  return (
    <div class={`nw-track ${props.class ?? ''}`} classList={{ 'nw-track-seekable': store.seekable }}>
      <div
        ref={track}
        class="nw-track-rows"
        onPointerDown={(event) => {
          if (event.button !== 0 || !store.seekable) {
            return
          }
          track.setPointerCapture(event.pointerId)
          store.startSeek(fraction(event))
        }}
        onPointerMove={(event) => store.moveSeek(fraction(event))}
        onPointerUp={store.endSeek}
        onPointerCancel={store.endSeek}
        onDblClick={store.replay}
      >
        <For each={store.rows()}>
          {(row) => (
            <div class="nw-track-row">
              <For each={row}>
                {(item) => (
                  <div
                    class={`nw-track-bar nw-track-${item.kind}`}
                    classList={{ 'nw-track-active': store.isActive(item) }}
                    style={{ left: `${item.left}%`, width: `${item.width}%` }}
                    onPointerEnter={(event) => {
                      anchor = event.currentTarget
                      store.hover(item)
                    }}
                    onPointerLeave={store.leave}
                  >
                    <span class="nw-track-label">{item.procedural.type}</span>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
        <Show when={props.timeline}>
          <div class="nw-track-playhead" style={{ left: `${state.playhead}%` }} />
        </Show>
      </div>
      <div
        ref={details}
        popover="manual"
        class="nw-track-details"
        onPointerEnter={store.keep}
        onPointerLeave={store.leave}
      >
        <Show when={store.hovered()}>
          {(item) => (
            <>
              <div class="nw-track-details-head">
                <span class="nw-track-details-type">{item().procedural.type}</span>
                <span class="nw-track-details-dim">{barTimes(item())}</span>
              </div>
              <Show when={hitShapeLabel(item().procedural)}>
                {(label) => <div class="nw-track-details-shape">{label()}</div>}
              </Show>
              <Show when={store.link()}>
                {(link) => (
                  <a class="nw-track-details-link" href={link().href}>
                    {link().label}
                  </a>
                )}
              </Show>
              <dl class="nw-track-params">
                <For each={paramEntries(item().procedural)}>
                  {([name, value]) => (
                    <>
                      <dt>{name}</dt>
                      <dd>{value}</dd>
                    </>
                  )}
                </For>
              </dl>
            </>
          )}
        </Show>
      </div>
    </div>
  )
}
