import { ElementRef, Injectable, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { Engine } from '@babylonjs/core'
import { AdbAction, AdbFragment, AdbPlayerState } from '@nw-viewer/adb'
import { AdbPlayer } from '@nw-viewer/adb/player'
import { SkyboxComponent } from '@nw-viewer/components/skybox-component'
import { GameService, GameServiceContainer, GameServiceType } from '@nw-viewer/ecs'
import { ContentProvider } from '@nw-viewer/services/content-provider'
import { DebugShapeProvider } from '@nw-viewer/services/debug-shapes'
import { EngineProvider } from '@nw-viewer/services/engine-provider'
import { LevelProvider } from '@nw-viewer/services/level-provider'
import { LightingProvider } from '@nw-viewer/services/lighting-provider'
import { SceneProvider } from '@nw-viewer/services/scene-provider'
import { environment } from 'apps/web/environments'
import { filter, map } from 'rxjs'

@Injectable()
export class GameViewerService {
  public readonly isLoading = signal(false)
  public readonly isEmpty = signal(false)
  public readonly hasError = signal(false)
  public readonly host = signal<ElementRef<HTMLElement> | null>(null)
  public readonly game = signal<GameServiceContainer>(null)
  public readonly adbPlayer = signal<AdbPlayer>(null)
  public readonly adbActions = signal<AdbAction[]>(null)
  public readonly adbTags = signal<string[]>(null)
  public readonly showTagBrowser = signal(false)

  private game$ = toObservable(this.game).pipe(filter((it) => !!it))

  public create(host: ElementRef<HTMLElement>, canvas: HTMLCanvasElement) {
    this.host.set(host)
    this.game.set(createGame(canvas))
  }

  public service<T extends GameService>(type: GameServiceType<T>) {
    return this.game$.pipe(map((game) => game.get(type)))
  }
}

export function createGame(canvas: HTMLCanvasElement) {
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    depth: true,
    alpha: true,
    antialias: true,
    adaptToDeviceRatio: true,
  })

  const game = new GameServiceContainer(null)
    .add(new EngineProvider(engine))
    .add(new SceneProvider())
    .add(new LightingProvider())
    .add(new DebugShapeProvider())
    .add(
      new ContentProvider({
        rootUrl: environment.modelsUrl,
        nwbtUrl: environment.nwbtUrl,
      }),
    )
    .add(new LevelProvider())
    .initialize()

  const root = game.createEntity()
  root.addComponent(new SkyboxComponent())
  root.initialize(game)
  root.activate()

  return game
}
