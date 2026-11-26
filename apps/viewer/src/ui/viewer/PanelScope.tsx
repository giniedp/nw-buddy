import { createContext, createSignal, useContext, type JSX } from 'solid-js'

/**
 * Connects the controls of a panel to plain engine objects, like the panel of tweak-ui's builder:
 * values are pulled from the objects and re-read when the panel redraws, which it does after
 * each input. Changes the engine makes on its own are not seen, use `track` for those.
 */
export interface UiPanel {
  /**
   * Reads a plain value. In a reactive scope (e.g. a JSX expression) it is re-read on {@link UiPanel.redraw}.
   */
  pull<T>(read: () => T): T
  /**
   * Re-reads the values of this panel, e.g. after writing an engine object
   */
  redraw(): void
  /**
   * Props that bind a control to a property: the property name as label, the pulled value
   * and an `onInput` that writes the property and redraws the panel.
   *
   * @example
   * ```tsx
   * <ScalarWidget {...panel.bind(camera, 'near')} min={0.01} max={1} />
   * ```
   */
  bind<T extends object, K extends keyof T & string>(
    target: T,
    key: K,
  ): { label: K; readonly value: T[K]; onInput: (value: T[K]) => void }
}

export function createUiPanel(): UiPanel {
  const [version, setVersion] = createSignal(0)
  const panel: UiPanel = {
    pull(read) {
      version()
      return read()
    },
    redraw() {
      setVersion((v) => v + 1)
    },
    // a spread is re-evaluated on each prop access, so this must stay cheap (no memos)
    bind(target, key) {
      return {
        label: key,
        get value() {
          return panel.pull(() => target[key])
        },
        onInput: (value) => {
          target[key] = value
          panel.redraw()
        },
      }
    },
  }
  return panel
}

const PanelContext = createContext<UiPanel>()

/**
 * Provides a {@link UiPanel} to its content, e.g. a sidebar or a dialog
 */
export function PanelScope(props: { children: JSX.Element }) {
  return <PanelContext.Provider value={createUiPanel()}>{props.children}</PanelContext.Provider>
}

/**
 * The panel of the closest {@link PanelScope}. Call it when the component is set up.
 */
export function usePanel(): UiPanel {
  const panel = useContext(PanelContext)
  if (!panel) {
    throw new Error('usePanel: no PanelScope')
  }
  return panel
}
