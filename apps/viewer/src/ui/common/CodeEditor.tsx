import { onCleanup, onMount } from 'solid-js'
import { editorFont, ensureTheme, monaco, THEME } from './monaco'

/**
 * A read-only monaco editor showing `text`. Default export for `lazy()`: monaco loads with the first editor.
 */
export default function CodeEditor(props: { text: string; language: string }) {
  let host!: HTMLDivElement
  onMount(() => {
    ensureTheme()
    const editor = monaco.editor.create(host, {
      value: props.text,
      language: props.language,
      theme: THEME,
      readOnly: true,
      // tabs and modes stay mounted while hidden; this measures again when they show
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'none',
      ...editorFont(),
    })
    onCleanup(() => {
      editor.getModel()?.dispose()
      editor.dispose()
    })
  })
  return <div class="nw-code" ref={host} />
}
