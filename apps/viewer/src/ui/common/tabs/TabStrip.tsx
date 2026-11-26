import { createEffect, For, Show } from 'solid-js'
import { Icon } from 'tweak-ui'
import svgBars from '../../icons/bars.svg?raw'
import svgXmark from '../../icons/xmark.svg?raw'
import { createTabStripStore, popoverLeft, type TabStripProps } from './TabStrip.store'
import type { TabMenuItem } from './types'
import './TabStrip.css'

export type { TabMenuItem, TabStripItem } from './types'

/**
 * A row of closable tabs, for documents. A click activates a tab, the × or a middle click closes it, a double click
 * keeps a temporary tab. The active tab is scrolled into view.
 *
 * With `menu`, the icon of a tab turns into a menu button while the pointer is over the tab (or the button has the
 * keyboard focus). The menu lists the entries `menu` returns for that tab.
 */
export function TabStrip(props: TabStripProps) {
  const store = createTabStripStore(props)
  let strip!: HTMLDivElement
  let menu!: HTMLDivElement

  // the active tab in view, also when tabs are added
  createEffect(() => {
    const active = props.active
    void props.items
    queueMicrotask(() =>
      strip.querySelector(`[data-tab="${active}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' }),
    )
  })

  // below the button, inside the window
  const openMenu = (button: HTMLElement, id: number) => {
    if (!store.openMenu(id)) {
      return
    }
    const rect = button.getBoundingClientRect()
    menu.style.top = `${rect.bottom + 4}px`
    menu.showPopover()
    menu.style.left = `${popoverLeft(rect.left, menu.offsetWidth, window.innerWidth)}px`
    menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  }

  const select = (item: TabMenuItem) => {
    menu.hidePopover()
    item.onSelect()
  }

  return (
    <>
      <div class="nw-tab-strip" role="tablist" ref={strip}>
        <For each={props.items}>
          {(item) => (
            <div
              class="nw-tab"
              role="tab"
              data-tab={item.id}
              title={item.tooltip}
              aria-selected={store.isActive(item)}
              classList={{
                'nw-tab-active': store.isActive(item),
                'nw-tab-preview': !!item.preview,
                'nw-tab-menu-open': store.isMenuOpen(item),
              }}
              onClick={() => props.onActivate(item.id)}
              onDblClick={() => props.onPersist?.(item.id)}
              onAuxClick={(e) => {
                if (e.button === 1) {
                  props.onClose(item.id)
                }
              }}
              // no autoscroll cursor on middle click
              onMouseDown={(e) => e.button === 1 && e.preventDefault()}
            >
              <span class="nw-tab-icon">
                {item.icon && <Icon svg={item.icon} />}
                <Show when={store.hasMenu()}>
                  <button
                    type="button"
                    class="nw-tab-menu-button"
                    title="Tab menu"
                    aria-haspopup="menu"
                    onClick={(e) => {
                      e.stopPropagation()
                      openMenu(e.currentTarget, item.id)
                    }}
                    onDblClick={(e) => e.stopPropagation()}
                  >
                    <Icon svg={svgBars} />
                  </button>
                </Show>
              </span>
              <span class="nw-tab-title">{item.title}</span>
              <button
                type="button"
                class="nw-tab-close"
                title="Close (Alt+W)"
                onClick={(e) => {
                  e.stopPropagation()
                  props.onClose(item.id)
                }}
              >
                <Icon svg={svgXmark} />
              </button>
            </div>
          )}
        </For>
      </div>
      <div
        ref={menu}
        popover="auto"
        role="menu"
        class="nw-tab-menu"
        onToggle={(e) => {
          if (e.newState === 'closed') {
            store.menuClosed()
          }
        }}
      >
        <For each={store.menuItems()}>
          {(item) => (
            <button
              type="button"
              role="menuitem"
              class="nw-tab-menu-item"
              disabled={item.disabled}
              onClick={() => select(item)}
            >
              {item.label}
            </button>
          )}
        </For>
      </div>
    </>
  )
}
