import { NgZone } from '@angular/core'

import { Viewer, ViewerDetails, createViewerForCanvas } from '@babylonjs/viewer'
export type { Viewer, Model } from '@babylonjs/viewer'
import { CreateScreenshotAsync, CreateScreenshotWithResizeAsync } from '@babylonjs/core'
import { registerNwMaterialPlugin } from './nw-material-plugin'

export async function createViewer(options: {
  element: HTMLCanvasElement
  zone: NgZone
  mode?: 'dark' | 'light'
  onInitialized?: (details: ViewerDetails) => void
}): Promise<Viewer> {
  registerNwMaterialPlugin()
  const canvas = options.element
  const zone = options.zone
  return zone.runOutsideAngular(async () => {
    const viewer = await createViewerForCanvas(canvas, {
      engine: 'WebGL', // must be webgl, nw material plugin does not work with webgpu yet
      antialias: true,
      adaptToDeviceRatio: true,
      clearColor: [0, 0, 0, 0],
      alpha: true,
      premultipliedAlpha: true,
      onInitialized: (details) => {
        options.onInitialized?.(details)
      },
    })
    return viewer
  })
}

export function viewerUpdateMode(viewer: Viewer, mode: 'dark' | 'light') {
  viewer.environmentConfig = {
    intensity: mode === 'light' ? 1 : 0,
    blur: 0.5,
  }
}

export async function viewerCaptureImage(viewer: Viewer, size: number) {
  const engine = viewer['_engine']
  const camera = viewer['_camera']
  return CreateScreenshotAsync(engine as any, camera, size)
}
