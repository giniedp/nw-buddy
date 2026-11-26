import { createResource } from 'solid-js'
import type { SheetColumn } from '../../../api/browse'
import { useApp } from '../../app/ViewerApp'
import type { RowRef } from '../families'
import { sheetPartTrigger } from '../songs'

/**
 * The rows a reference names: the best matching family first, the others that have the key too
 */
export function createRefTargets(props: { column: SheetColumn; value: string; from: RowRef }) {
  const app = useApp()
  const [targets] = createResource(
    () => props.value,
    (value) => app.datasheets.resolveRefs(props.column, value, props.from),
  )
  return {
    targets: () => targets() ?? [],
    /**
     * Looked up, no family has the key
     */
    dead: () => targets.state === 'ready' && !targets()?.length,
  }
}

/**
 * The audio trigger of the instrument part of a song sheet (songs.ts), null when it has none
 */
export function createSongTrigger(props: { value: string }) {
  const app = useApp()
  const [trigger] = createResource(
    () => props.value,
    (value) => sheetPartTrigger(app.datasheets, value),
  )
  return {
    trigger: () => trigger() ?? null,
  }
}

/**
 * The file of the archive a value names, null when the archive lacks it
 */
export function createFoundFile(props: { path: string }) {
  const app = useApp()
  const [file] = createResource(
    () => props.path,
    (path) => app.assets.find(path),
  )
  return {
    file: () => file() ?? null,
    /**
     * Looked up, the archive lacks the file
     */
    dead: () => file.state === 'ready' && !file(),
  }
}
