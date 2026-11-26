import { createEffect, For, Index, on, onCleanup, onMount, type JSX } from 'solid-js'
import { TextInput } from 'tweak-ui'
import { ascii, createHexViewStore, isMarked, parseOffset, ROW_BYTES, type HexViewProps } from './HexView.store'
import type { HexRange } from './types'
import './HexView.css'

/**
 * Bytes as offset / hex / ascii rows. Only the visible rows are rendered. `highlight` marks a range
 * and scrolls to it whenever it changes. `tools` are placed next to the go-to input.
 */
export function HexView(props: HexViewProps & { tools?: JSX.Element }) {
  const store = createHexViewStore(props)
  const { state } = store
  let scroller!: HTMLDivElement
  let probe!: HTMLDivElement

  const scrollTo = (offset: number) => {
    scroller.scrollTop = store.scrollTopFor(offset)
  }

  // scroll to a new highlight once the view has a height
  createEffect(
    on([() => props.highlight, () => state.viewPx], ([range, height]) => {
      if (range && height > 0) {
        scrollTo(range.offset)
      }
    }),
  )

  onMount(() => {
    store.setRowPx(probe.getBoundingClientRect().height)
    // tabs stay mounted while hidden: the height is 0 then and updates when they show again
    const observer = new ResizeObserver(() => store.setViewPx(scroller.clientHeight))
    observer.observe(scroller)
    onCleanup(() => observer.disconnect())
  })

  return (
    <div class="nw-hex-view">
      <div class="nw-view-bar">
        <TextInput
          class="nw-hex-goto"
          placeholder="Go to offset (0x… or decimal)"
          onChange={(text) => {
            const offset = parseOffset(text)
            if (offset !== undefined) {
              scrollTo(offset)
            }
          }}
        />
        {props.tools}
      </div>
      <div class="nw-hex-scroll" ref={scroller} onScroll={() => store.setScrollTop(scroller.scrollTop)}>
        <div class="nw-hex-row nw-hex-probe" ref={probe}>
          0
        </div>
        <div style={{ height: `${state.layout.spacerPx}px` }} />
        {/* scaled, the window sits at the scroll position; clipped, so its last row adds no scroll */}
        <div
          class="nw-hex-window"
          style={{
            top: `${state.layout.windowTop}px`,
            height: state.layout.scaled ? `${state.viewPx}px` : undefined,
          }}
        >
          <For each={state.layout.visible}>
            {(row) => (
              <HexRow
                offset={row * ROW_BYTES}
                digits={state.offsetDigits}
                bytes={store.rowBytes(row)}
                highlight={props.highlight}
              />
            )}
          </For>
        </div>
      </div>
    </div>
  )
}

function HexRow(props: { offset: number; digits: number; bytes: Uint8Array; highlight?: HexRange }) {
  return (
    <div class="nw-hex-row">
      <span class="nw-hex-offset">{props.offset.toString(16).padStart(props.digits, '0')}</span>
      <span class="nw-hex-bytes">
        <Index each={Array.from(props.bytes)}>
          {(b, i) => (
            <span
              classList={{
                'nw-hex-zero': b() === 0,
                'nw-hex-gap': i === 8,
                'nw-hex-mark': isMarked(props.highlight, props.offset + i),
              }}
            >
              {b().toString(16).padStart(2, '0')}
            </span>
          )}
        </Index>
      </span>
      <span>{ascii(props.bytes)}</span>
    </div>
  )
}
