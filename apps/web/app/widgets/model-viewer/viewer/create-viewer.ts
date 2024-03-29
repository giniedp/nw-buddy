import { NgZone } from '@angular/core'
import 'babylonjs'
import { DefaultViewer, ViewerModel } from 'babylonjs-viewer'

export async function createViewer(options: {
  element: HTMLElement
  zone: NgZone
  mode?: 'dark' | 'light'
  onModelLoaded?: (model: ViewerModel) => void
  onModelError?: (err: any) => void
  onEngineInit?: (viewer: DefaultViewer) => void
  onModelProgress?: (progress: any) => void
}): Promise<DefaultViewer> {
  const zone = options.zone
  return zone.runOutsideAngular(async () => {
    const viewer = new DefaultViewer(options.element, {
      engine: {
        antialiasing: true,
        hdEnabled: true,
        adaptiveQuality: true,
      },
      scene: {
        clearColor: {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
        },
      },
      ground: {
        opacity: 0,
      },
      templates: {
        navBar: null,
        loadingScreen: null,
      } as any,
    })

    viewer.onSceneInitObservable.add((scene) => {
      viewerUpdateMode(viewer, options.mode || 'dark')
    })
    viewer.onModelLoadedObservable.add((model) => {
      zone.run(() => {
        options?.onModelLoaded?.(model)
      })
    })
    viewer.onModelLoadErrorObservable.add((err) => {
      zone.run(() => {
        options?.onModelError?.(err)
      })
    })
    viewer.onModelLoadProgressObservable.add((progress) => {
      zone.run(() => {
        options?.onModelProgress?.(progress)
      })
    })
    viewer.onEngineInitObservable.add(() => {
      zone.run(() => {
        options?.onEngineInit?.(viewer)
      })
    })
    viewer.onInitDoneObservable.addOnce(() => {
      zone.run(() => {
        //options?.onEngineInit?.(viewer)
      })
    })
    return new Promise<DefaultViewer>((resolve) => {
      viewer.onInitDoneObservable.addOnce(() => {
        console.log(viewer)
        resolve(viewer)
      })
    })
  })
}

export function viewerUpdateMode(viewer: DefaultViewer, mode: 'dark' | 'light') {
  if (mode === 'light') {
    viewerSetLightMode(viewer)
  } else {
    viewerSetDarkMode(viewer)
  }
}

function viewerSetLightMode(viewer: DefaultViewer) {
  const skyMat = viewer.sceneManager.environmentHelper.skyboxMaterial
  const gndMat = viewer.sceneManager.environmentHelper.groundMaterial
  if (skyMat) {
    skyMat.alpha = 1
  }
  if (gndMat) {
    gndMat.alpha = 0.4
  }
  viewer.sceneManager.bloomEnabled = true
  viewer.sceneManager.scene.environmentIntensity = 1
  viewer.sceneManager.defaultRenderingPipeline.imageProcessing.contrast = 1.5
}

function viewerSetDarkMode(viewer: DefaultViewer) {
  const skyMat = viewer.sceneManager.environmentHelper.skyboxMaterial
  const gndMat = viewer.sceneManager.environmentHelper.groundMaterial
  if (skyMat) {
    skyMat.alpha = 0
  }
  if (gndMat) {
    gndMat.alpha = 0
  }
  viewer.sceneManager.bloomEnabled = false
  viewer.sceneManager.scene.environmentIntensity = 1
  viewer.sceneManager.defaultRenderingPipeline.imageProcessing.contrast = 2
}
