import { createSignal } from 'solid-js'
import type { ExportAnimation } from '../../api/export'

/**
 * The animations a character export includes, per file path: the browser's Character mode writes them, the export
 * dialog of the file reads them
 */
const [selections, setSelections] = createSignal<ReadonlyMap<string, ExportAnimation[]>>(new Map())

const NONE: ExportAnimation[] = []

/**
 * The animations the export of a file includes, reactive; none when no view selected any
 */
export function exportAnimations(path: string): ExportAnimation[] {
  return selections().get(path) ?? NONE
}

/**
 * Sets the animations the export of a file includes (no change when the list is the same)
 */
export function setExportAnimations(path: string, animations: ExportAnimation[]) {
  const current = exportAnimations(path)
  if (sameAnimations(current, animations)) {
    return
  }
  const next = new Map(selections())
  if (animations.length) {
    next.set(path, animations)
  } else {
    next.delete(path)
  }
  setSelections(next)
}

function sameAnimations(a: ExportAnimation[], b: ExportAnimation[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i].file !== b[i].file || a[i].name !== b[i].name) {
      return false
    }
  }
  return true
}
