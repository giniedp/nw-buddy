import { NgZone } from '@angular/core'
import type from 'babylonjs'
import type { DefaultViewer, ViewerModel } from 'babylonjs-viewer'

export async function loadBabylon() {
  return import('babylonjs-viewer')
}

export async function createViewer(options: {
  element: HTMLElement
  zone: NgZone
  hideFloor?: boolean
  onModelLoaded?: (model: ViewerModel) => void
  onModelError?: (err: any) => void
  onEngineInit?: (viewer: DefaultViewer) => void
  onModelProgress?: (progress: any) => void
}) {
  const zone = options.zone
  return zone.runOutsideAngular(async () => {
    const { DefaultViewer } = await loadBabylon()
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
      skybox: {
        infiniteDistance: true,
        color: {
          r: 1,
          g: 0,
          b: 0,
        },
      },
      ground: options.hideFloor
        ? null
        : {
            //opacity: 0.2,
          },
      templates: {
        navBar: null,
        loadingScreen: {
          html: `
            <div class="absolute inset-0 flex items-center justify-center transition-opacity bg-base-300">
              <picture class="block aspect-square w-3/5 relative">
                <img class="absolute top-0 left-0 right-0 bottom-0 spin-cw" src="/assets/loaders/crafting_rune_clockwise.png"/>
                <img class="absolute top-0 left-0 right-0 bottom-0 spin-ccw" src="/assets/loaders/crafting_rune_counter_clockwise.png"/>
              </picture>
            </div>
          `,
          params: {},
        },
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
