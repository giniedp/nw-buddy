import { NgZone } from '@angular/core'

import type { Viewer, ViewerDetails } from '@babylonjs/viewer'
export type { Model, Viewer, ViewerDetails } from '@babylonjs/viewer'

export async function createViewer(options: {
  element: HTMLCanvasElement
  zone: NgZone
  mode?: 'dark' | 'light'
  onInitialized?: (details: ViewerDetails) => void
}): Promise<Viewer> {
  await import('@nw-viewer/babylon/extensions').then(({ NwMaterialPlugin }) => {
    NwMaterialPlugin.register()
  })
  const { CreateViewerForCanvas } = await import('@babylonjs/viewer')

  const canvas = options.element
  const zone = options.zone
  return zone.runOutsideAngular(async () => {
    const viewer = await CreateViewerForCanvas(canvas, {
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
  const { CreateScreenshotAsync } = await import('@babylonjs/core')
  return CreateScreenshotAsync(engine as any, camera, size)
}

export function renderFrame(viewer: Viewer) {
  viewer['_scene'].render()
}
