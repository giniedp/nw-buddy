import { Engine } from '@babylonjs/core'
import { ViewerBridge } from '../../common'
import { GameServiceContainer } from '../../ecs'
import { SkyboxComponent } from '../components/skybox-component'
import { BabylonViewerBridge } from './babylon-viewer-bridge'
import { ContentProvider } from './content-provider'
import { DebugShapeProvider } from './debug-shapes'
import { EngineProvider } from './engine-provider'
import { LevelProvider } from './level-provider'
import { LightingProvider } from './lighting-provider'
import { SceneProvider } from './scene-provider'

export interface BabylonViewerOptions {
  canvas: HTMLCanvasElement
  resizeElement?: HTMLElement
  rootUrl: string
  nwbtUrl: string
}
export function createBabylonViewer(options: BabylonViewerOptions) {
  const engine = new Engine(options.canvas, true, {
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
        rootUrl: options.rootUrl,
        nwbtUrl: options.nwbtUrl,
      }),
    )
    .add(new LevelProvider())
    .add(new BabylonViewerBridge(), ViewerBridge)
    .initialize()

  const root = game.createEntity()
  root.addComponent(new SkyboxComponent())
  root.initialize(game)
  root.activate()

  return game
}
