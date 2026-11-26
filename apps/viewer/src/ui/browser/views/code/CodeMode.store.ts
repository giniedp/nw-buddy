import { createMemo, createResource } from 'solid-js'
import { createStore } from 'solid-js/store'
import { formatBytes } from '../../../common/format'
import type { AssetViewProps } from '../registry'
import type { CodeModeState, LoadedText, TextSource } from './types'

/**
 * Text larger than this is cut, monaco gets slow
 */
export const TEXT_LIMIT = 8 * 1024 * 1024

export type CodeModeProps = AssetViewProps & { source: TextSource }

export type CodeModeStore = ReturnType<typeof createCodeModeStore>

/**
 * The state of a code view: reads the text from its source, cut to the limit of the editor
 */
export function createCodeModeStore(props: CodeModeProps) {
  // keyed by path and kind: the context object is recreated, e.g. when the types load
  const [loaded] = createResource(
    () => `${props.ctx.kind}:${props.ctx.path}`,
    async () => cutText(await props.source.read(props.ctx), TEXT_LIMIT),
  )
  // reading a failed resource throws: guard every read
  const text = createMemo(() => (loaded.error ? undefined : loaded()))
  const language = createMemo(() => {
    const it = text()
    return it ? props.source.language(props.ctx, it.text) : 'plaintext'
  })

  const [state] = createStore<CodeModeState>({
    get loadError() {
      return loaded.error ? errorMessage(loaded.error) : null
    },
    get ready() {
      return !!text()
    },
    get text() {
      return text()?.text ?? ''
    },
    get language() {
      return language()
    },
    get notice() {
      const it = text()
      return it ? cutNotice(it) : ''
    },
  })

  return { state }
}

/**
 * The text up to the limit, with the size of the whole text
 */
export function cutText(full: string, limit: number): LoadedText {
  return { text: full.length > limit ? full.slice(0, limit) : full, size: full.length }
}

/**
 * Tells that a text was cut, empty when it was not
 */
export function cutNotice(it: LoadedText): string {
  if (it.size <= it.text.length) {
    return ''
  }
  return `Showing the first ${formatBytes(it.text.length)} of ${formatBytes(it.size)}.`
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}
