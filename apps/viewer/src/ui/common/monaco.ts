/**
 * Monaco setup, loaded on demand (dynamic import from CodeEditor.tsx), so only the tabs that show text pay
 * for it. Only the languages of the game files are bundled: xml, json, ini, lua, plaintext.
 */
import 'monaco-editor/esm/vs/editor/editor.all.js'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import 'monaco-editor/esm/vs/basic-languages/ini/ini.contribution'
import 'monaco-editor/esm/vs/basic-languages/lua/lua.contribution'
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution'
import 'monaco-editor/esm/vs/language/json/monaco.contribution'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

self.MonacoEnvironment = {
  getWorker(_id: string, label: string) {
    return label === 'json' ? new JsonWorker() : new EditorWorker()
  },
}

export const THEME = 'nw'

/**
 * Resolves a CSS value (e.g. `var(--nw-text-md)`) through a probe element in the themed page
 */
function computed(property: 'color' | 'fontSize' | 'fontFamily', value: string) {
  const probe = document.createElement('span')
  probe.className = 'tweak-ui'
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style[property] = value
  document.body.appendChild(probe)
  const result = getComputedStyle(probe)[property]
  probe.remove()
  return result
}

let canvas: CanvasRenderingContext2D | null = null

/**
 * A css color token as `#rrggbbaa`, the only format monaco themes take. A canvas converts it: tokens may be
 * `color-mix()`, which computes to `color(srgb …)` or `oklab(…)`, not `rgb()`.
 */
function tokenColor(token: string) {
  canvas ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  canvas.clearRect(0, 0, 1, 1)
  canvas.fillStyle = computed('color', `var(${token})`)
  canvas.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data
  return `#${[r, g, b, a].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

let themed = false

/**
 * Defines the `nw` theme from the color tokens of the page; call after the stylesheet is applied
 */
export function ensureTheme() {
  if (themed) {
    return
  }
  themed = true
  monaco.editor.defineTheme(THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': tokenColor('--nw-bg'),
      'editor.foreground': tokenColor('--nw-text'),
      'editor.lineHighlightBackground': tokenColor('--nw-hover'),
      'editorLineNumber.foreground': tokenColor('--nw-text-dim'),
      'editorLineNumber.activeForeground': tokenColor('--nw-text'),
      'editorCursor.foreground': tokenColor('--nw-accent'),
      'minimap.background': tokenColor('--nw-bg'),
    },
  })
}

/**
 * Editor font: the body text size and the tweak-ui mono font
 */
export function editorFont() {
  return {
    fontSize: parseFloat(computed('fontSize', 'var(--nw-text-md)')),
    fontFamily: computed('fontFamily', 'var(--twk-font-mono)'),
  }
}

export { monaco }
