import { BaseTexture, CubeTexture, GetExtensionFromUrl, HDRCubeTexture, Scene } from '@babylonjs/core'
import { BehaviorSubject, Subject, switchMap, takeUntil, tap } from 'rxjs'
import { GameService, GameServiceContainer } from '../../ecs'
import { SceneProvider } from './scene-provider'

export class LightingProvider implements GameService {
  #envUrl = new BehaviorSubject<string>('https://assets.babylonjs.com/textures/parking.env')
  #envMap = new BehaviorSubject<BaseTexture>(null)
  #loading$ = new BehaviorSubject<boolean>(false)
  #skybox$ = new BehaviorSubject<boolean>(false)
  destroy$ = new Subject<void>()
  #scene: SceneProvider

  public game: GameServiceContainer
  public envUrl$ = this.#envUrl.asObservable()
  public envMap$ = this.#envMap.asObservable()
  public loading$ = this.#loading$.asObservable()
  public skybox$ = this.#skybox$.asObservable()

  public initialize(game: GameServiceContainer) {
    this.game = game
    this.#scene = game.get(SceneProvider)
    this.#envUrl
      .pipe(
        tap(() => this.#loading$.next(true)),
        switchMap((url) => {
          return createCubeTexture(url, this.#scene.main).catch((err) => {
            console.error('Failed to load env map', err)
            return null
          })
        }),
        tap(() => this.#loading$.next(false)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (envMap) => {
          this.setEnvMap(envMap)
        },
        complete: () => {
          this.setEnvMap(null)
        },
        error: (err) => {
          console.error('Failed to load env map', err)
          this.setEnvMap(null)
        },
      })
  }

  public destroy(): void {
    this.destroy$.next()
  }

  public load(url: string) {
    this.#envUrl.next(url)
  }

  public setSkyboxEnabled(enabled: boolean) {
    this.#skybox$.next(enabled)
  }

  private setEnvMap(envMap: BaseTexture) {
    if (envMap) {
      envMap.level = 1.0
    }
    const scene = this.#scene.main
    if (scene.environmentTexture) {
      scene.environmentTexture.dispose()
      scene.environmentTexture = null
    }
    if (envMap) {
      scene.environmentTexture = envMap
    }
    this.#envMap.next(envMap)
  }
}

async function createCubeTexture(url: string, scene: Scene, extension?: string) {
  if (!url) {
    return null
  }
  extension = extension ?? GetExtensionFromUrl(url)
  const instantiateTexture = await (async () => {
    if (extension === '.hdr') {
      return () =>
        new HDRCubeTexture(url, scene, 256, false, true, false, true, undefined, undefined, undefined, true, true)
    } else {
      return () => new CubeTexture(url, scene, null, false, null, null, null, undefined, true, extension, true)
    }
  })()

  const originalUseDelayedTextureLoading = scene.useDelayedTextureLoading
  try {
    scene.useDelayedTextureLoading = false
    return instantiateTexture()
  } finally {
    scene.useDelayedTextureLoading = originalUseDelayedTextureLoading
  }
}
