import type { RowText } from '@nw-buddy/viewer'
import type { ModelItemInfo } from '../model-viewer/model-viewer.service'
import { getModelUrl } from '../model-viewer/utils/get-model-url'

/**
 * The model url and the root its textures resolve from (the CDN models root, or nwbt)
 */
export function modelUrls(model: Pick<ModelItemInfo, 'url'>) {
  const { rootUrl, modelUrl } = getModelUrl(model.url)
  const root = new URL(rootUrl, document.baseURI).href
  return { rootUrl: root, url: new URL(modelUrl, root).href }
}

/**
 * A data row as the viewer's row accessor: the text of a cell, '' when empty. Null without a row.
 */
export function rowText(row: object | null | undefined): RowText | null {
  if (!row) {
    return null
  }
  return (column: string) => {
    const value = (row as Record<string, unknown>)[column]
    return value == null ? '' : String(value)
  }
}
