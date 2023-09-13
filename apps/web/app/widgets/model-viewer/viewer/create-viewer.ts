import { NgZone } from '@angular/core'
import 'babylonjs'
import { DefaultViewer, ViewerModel } from 'babylonjs-viewer'

export async function createViewer(options: {
  element: HTMLElement
  zone: NgZone
  hideFloor?: boolean
  onModelLoaded?: (model: ViewerModel) => void
  onModelError?: (err: any) => void
  onEngineInit?: (viewer: DefaultViewer) => void
  onModelProgress?: (progress: any) => void
}): Promise<DefaultViewer> {
  const zone = options.zone
  return zone.runOutsideAngular(async () => {
    // const { DefaultViewer } = await loadBabylon()
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
      skybox: {},
      ground: options.hideFloor
        ? null
        : {
            //opacity: 0.2,
          },
      templates: {
        navBar: null,
        loadingScreen: null,
      } as any,
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
        resolve(viewer)
      })
    })
  })
}
