import { ElementRef, Injectable, signal } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { Engine } from '@babylonjs/core'
import { AdbAction, AdbFragment, AdbPlayerState } from '@nw-viewer/adb'
import { SkyboxComponent } from '@nw-viewer/components/skybox-component'
import { GameHost, GameSystem, GameSystemType } from '@nw-viewer/ecs'
import { DebugShapeProvider } from '@nw-viewer/services/debug-shapes'
import { ContentProvider } from '@nw-viewer/services/content-provider'
import { EngineProvider } from '@nw-viewer/services/engine-provider'
import { LevelProvider } from '@nw-viewer/services/level-provider'
import { LightingProvider } from '@nw-viewer/services/lighting-provider'
import { SceneProvider } from '@nw-viewer/services/scene-provider'
import { environment } from 'apps/web/environments'
import { filter, map } from 'rxjs'

@Injectable()
export class GameSystemService {
  public readonly host = signal<ElementRef<HTMLElement> | null>(null)
  public readonly game = signal<GameHost>(null)
  public readonly adbPlayerState = signal<AdbPlayerState>(null)
  public readonly adbActions = signal<AdbAction[]>(null)
  public readonly adbTags = signal<string[]>(null)
  public readonly adbFragment = signal<AdbFragment>(null)

  private game$ = toObservable(this.game).pipe(filter((it) => !!it))

  public create(host: ElementRef<HTMLElement>, canvas: HTMLCanvasElement) {
    this.host.set(host)
    this.game.set(createGame(canvas))
  }

  public service<T extends GameSystem>(type: GameSystemType<T>) {
    return this.game$.pipe(map((game) => game.system(type)))
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

  const game = new GameHost()
  game
    .addSystems(
      new EngineProvider(engine),
      new SceneProvider(),
      new LightingProvider(),
      new DebugShapeProvider(),
      new ContentProvider({
        rootUrl: environment.modelsUrl,
        nwbtUrl: environment.nwbtUrl,
      }),
      new LevelProvider(),
    )
    .initialize()

  const root = game.createEntity()
  root.addComponent(new SkyboxComponent())
  // root.addComponent(new CameraComponent())
  root.initialize(game)
  root.activate()

  return game
}
