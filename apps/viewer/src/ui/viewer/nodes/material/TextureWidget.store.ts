import type { Texture } from '@gglib/graphics'
import { createMemo } from 'solid-js'
import { createStore } from 'solid-js/store'
import { renderThumbnail } from './thumbnail'
import type { TextureWidgetState } from './types'

/**
 * The size of the thumbnail in the panel, in pixels
 */
const THUMBNAIL_SIZE = 128

export type TextureWidgetStore = ReturnType<typeof createTextureWidgetStore>

/**
 * The facts of a texture and its images: the thumbnail, and the full size image while the dialog is open
 */
export function createTextureWidgetStore(props: { texture: Texture }) {
  // the same texture is not rendered again on redraw
  const texture = createMemo(() => props.texture)
  const thumbnail = createMemo(() => renderThumbnail(texture(), THUMBNAIL_SIZE))

  const [state, setState] = createStore<TextureWidgetState>({
    open: false,
    get size() {
      return `${texture().width} x ${texture().height} x ${texture().depth}`
    },
    get format() {
      return texture().format
    },
    get mipLevels() {
      return texture().mipLevelCount
    },
    get megabytes() {
      return ((texture().sizeInBytes ?? 0) / 1024 / 1024).toFixed(2)
    },
  })

  // rendered when the dialog opens, not with the panel
  const image = createMemo(() => {
    if (!state.open) {
      return null
    }
    return renderThumbnail(texture(), texture().width)
  })

  return {
    state,
    /**
     * The thumbnail for the panel
     */
    thumbnail,
    /**
     * The texture in full size, null while the dialog is closed
     */
    image,
    open() {
      setState('open', true)
    },
    close() {
      setState('open', false)
    },
  }
}
