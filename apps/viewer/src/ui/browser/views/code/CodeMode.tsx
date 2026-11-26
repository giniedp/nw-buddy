import { lazy, Match, Show, Suspense, Switch, type Component } from 'solid-js'
import type { AssetViewProps } from '../registry'
import { createCodeModeStore, type CodeModeProps } from './CodeMode.store'
import type { TextSource } from './types'

// monaco is large: loaded with the first text view
const CodeEditor = lazy(() => import('../../../common/CodeEditor'))

/**
 * Shows text in a read-only editor. `source` is where the text comes from: the raw file or a conversion of nwbt.
 */
export function CodeMode(props: CodeModeProps) {
  const { state } = createCodeModeStore(props)
  // a new element per use: one element can only be in one place
  const reading = () => (
    <div class="nw-empty">
      <p class="nw-note">Reading…</p>
    </div>
  )
  return (
    <Switch fallback={reading()}>
      <Match when={state.loadError}>
        <div class="nw-empty">
          <p class="nw-note">Could not be read: {state.loadError}</p>
        </div>
      </Match>
      <Match when={state.ready}>
        <Show when={state.notice}>
          <p class="nw-note">{state.notice}</p>
        </Show>
        <Suspense fallback={reading()}>
          <CodeEditor text={state.text} language={state.language} />
        </Suspense>
      </Match>
    </Switch>
  )
}

/**
 * A view of the registry that shows the text of a source, see `sources.ts`
 */
export function codeMode(source: TextSource): Component<AssetViewProps> {
  return (props) => <CodeMode ctx={props.ctx} shown={props.shown} source={source} />
}
