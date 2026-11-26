import type { ViewerConfig } from '../config'

/**
 * The exposure of the tone mapping: `auto` adapts to the scene luminance like the game (eye adaptation with the time of
 * day values), a number is a fixed exposure (the HDR color is multiplied by it)
 */
export type ViewerExposure = number | 'auto'

export function getViewerExposure(config: ViewerConfig): ViewerExposure {
  return config.value.exposure === 'auto' ? 'auto' : config.value.fixedExposure
}

export function setViewerExposure(config: ViewerConfig, value: ViewerExposure) {
  if (value === 'auto') {
    config.set('exposure', 'auto')
    return
  }
  config.set('exposure', 'fixed')
  config.set('fixedExposure', value)
}
