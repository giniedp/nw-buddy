import { DDS } from '@gglib/loaders'
import { createEffect, createMemo, createResource, createSignal, onCleanup, untrack } from 'solid-js'
import { createStore } from 'solid-js/store'
import type { TexturePreview } from '../../../../graphics/passes/texture/TexturePreview'
import type {
  TexturePreviewChannels,
  TexturePreviewProjection,
} from '../../../../graphics/passes/texture/TexturePreview.wgsl'
import type { NwViewer } from '../../../../viewer'
import type { AssetViewProps } from '../registry'
import { loadDds } from './dds'
import type { DdsTexture, TextureFacts, TextureModeState } from './types'

const ZOOM_STEP = 1.15

export type TextureModeStore = ReturnType<typeof createTextureModeStore>

/**
 * The state and actions of the texture mode: loads and assembles the `.dds` of the tab, and owns the engine preview of
 * it while the mode is shown.
 *
 * @remarks
 * The engine shows one content at a time (D5): showing a texture unloads the level, the viewer opens it again. The
 * GPU texture exists only while the mode is shown, the assembled file stays loaded with the tab.
 */
export function createTextureModeStore(props: AssetViewProps) {
  // `shown` is an expression prop: every read outside an owner (the engine callbacks) would create a memo
  const shown = createMemo(() => props.shown)
  // tabs restored at startup mount their mode hidden: the files are read once the mode is shown
  const [wasShown, setWasShown] = createSignal(false)
  createEffect(() => {
    if (shown()) {
      setWasShown(true)
    }
  })
  const [dds] = createResource(
    () => wasShown() && props.ctx.path,
    (path) => loadDds(props.ctx.app, path),
  )
  // reading a failed resource throws: guard every read
  const texture = createMemo(() => (dds.error ? undefined : dds()))
  const facts = createMemo(() => {
    const it = texture()
    return it ? describeDds(it, props.ctx.path) : null
  })

  const [state, setState] = createStore<TextureModeState>({
    mip: 0,
    layer: 0,
    channels: 'rgba',
    projection: 'sphere',
    encode: null,
    error: null,
    get loadError() {
      return dds.error ? String(dds.error?.message ?? dds.error) : null
    },
    get facts() {
      return facts()
    },
    get encoded() {
      return encoded()
    },
    get layers() {
      return layers()
    },
    get layerLabel() {
      return facts()?.cubemap ? 'face' : 'slice'
    },
    get mipSize() {
      return mipSize()
    },
    get info() {
      return info()
    },
  })
  const encoded = createMemo(() => state.encode ?? facts()?.linear ?? false)
  const layers = createMemo(() => {
    const it = facts()
    return it ? layerCount(it, state.projection) : 1
  })
  const mipSize = createMemo(() => {
    const it = facts()
    return it ? mipSizeLabel(it, state.mip) : ''
  })
  const info = createMemo(() => {
    const it = facts()
    return it ? describe(it) : ''
  })

  let viewer: NwViewer | null = null
  let preview: TexturePreview | null = null

  const release = () => {
    preview?.dispose()
    preview = null
  }

  // creates the GPU texture when the engine runs and the file is assembled, shows it
  const show = () => {
    const it = texture()
    if (!viewer || !it || !shown()) {
      return
    }
    if (!preview) {
      try {
        preview = viewer.createTexturePreview({
          name: props.ctx.path,
          color: it.color.data,
          alpha: it.alpha?.data,
          normalMap: isNormalMap(props.ctx.path),
        })
        setState('error', null)
      } catch (e) {
        setState('error', String((e as Error)?.message ?? e))
        return
      }
    }
    applyState()
    viewer.showTexture(preview)
  }

  const applyState = () => {
    if (!preview) {
      return
    }
    preview.state.mip = state.mip
    preview.state.layer = state.layer
    preview.state.channels = state.channels
    preview.state.encode = state.encode ?? preview.info.linear
    preview.state.projection = state.projection
  }

  // the controls: read before the preview check, the effect must track them while there is no preview yet
  createEffect(() => {
    ;(state.mip, state.layer, state.channels, state.encode, state.projection)
    applyState()
  })
  createEffect(() => {
    if (texture() && shown()) {
      untrack(show)
    }
  })
  onCleanup(release)

  return {
    state,
    /**
     * The engine runs on the surface of the mode
     */
    attach(it: NwViewer) {
      viewer = it
      show()
    },
    /**
     * Hidden or closed: the next surface decides what the engine shows, the texture goes
     */
    detach() {
      release()
    },
    setMip(value: number) {
      setState('mip', Math.round(value))
    },
    setLayer(value: number) {
      setState('layer', Math.round(value))
    },
    setChannels(value: TexturePreviewChannels) {
      setState('channels', value)
    },
    setProjection(value: TexturePreviewProjection) {
      setState('projection', value)
    },
    toggleEncode() {
      setState('encode', !encoded())
    },
    /**
     * Fits the texture into the view and resets the rotation
     */
    fit() {
      preview?.fit()
      preview?.resetRotation()
    },
    /**
     * One texel per pixel
     */
    actualSize() {
      preview?.actualSize()
    },
    /**
     * Zooms in (`direction > 0`) or out at a point of the view, in fractions of its size
     */
    zoomAt(x: number, y: number, direction: number) {
      preview?.zoomAt(x, y, direction > 0 ? ZOOM_STEP : 1 / ZOOM_STEP)
    },
    /**
     * A drag by a fraction of the view size: a cubemap on a sphere or a cube turns, everything else moves
     */
    dragBy(dx: number, dy: number) {
      if (preview?.isProjected) {
        preview.rotateBy(dx, dy)
      } else {
        preview?.panBy(dx, dy)
      }
    },
  }
}

export function describeDds(texture: DdsTexture, path: string): TextureFacts {
  const info = texture.color.info
  const formatName = (DDS.DXGI_FORMAT[info.format] ?? String(info.format)).replace(/^DXGI_FORMAT_/, '')
  return {
    formatName,
    width: info.width,
    height: info.height,
    mips: info.mipCount,
    depth: info.isVolume ? info.depth : 1,
    cubemap: info.isCubemap,
    volume: info.isVolume,
    linear: /SRGB|FLOAT|BC6H/.test(formatName),
    parts: texture.color.parts,
    dropped: texture.color.dropped,
    alpha: !!texture.alpha,
    normalMap: isNormalMap(path) && /^(BC5|R8G8_)/.test(formatName),
  }
}

/**
 * The layers the slider scrubs: the faces of a cubemap shown face by face, the slices of a volume
 */
export function layerCount(tex: TextureFacts, projection: TexturePreviewProjection) {
  if (tex.cubemap) {
    return projection === 'faces' ? 6 : 1
  }
  return tex.depth
}

export function isNormalMap(path: string) {
  return /_ddna?\.dds$/i.test(path)
}

export function mipSizeLabel(tex: TextureFacts, mip: number) {
  return `${Math.max(tex.width >> mip, 1)}×${Math.max(tex.height >> mip, 1)}`
}

export function describe(tex: TextureFacts) {
  const parts = [tex.formatName, `${tex.width}×${tex.height}`, `${tex.mips} mips`]
  if (tex.cubemap) {
    parts.push('cubemap')
  }
  if (tex.volume) {
    parts.push(`${tex.depth} slices`)
  }
  if (tex.parts) {
    parts.push(`${tex.parts} split mips`)
  }
  if (tex.alpha) {
    parts.push('alpha from .dds.a')
  }
  if (tex.normalMap) {
    parts.push('normal map, z reconstructed')
  }
  if (tex.dropped) {
    parts.push(`${tex.dropped} small mips missing`)
  }
  return parts.join(' · ')
}
