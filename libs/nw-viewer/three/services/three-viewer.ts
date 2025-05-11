import { WebGLRenderer } from 'three'
import { NwData } from '../../../nw-data/db'
import { ViewerBridge } from '../../common'
import { GameServiceContainer } from '../../ecs'
import { ContentProvider } from './content-provider'
import { InstancedMeshProvider } from './instanced-mesh-provider'
import { LevelLoader } from './level-loader'
import { NwDataProvider, TranslateService } from './nw-data-provider'
import { RendererProvider } from './renderer-provider'
import { SceneProvider } from './scene-provider'
import { ThreeViewerBridge } from './three-viewer-bridge'

export interface ThreeGameOptions {
  canvas: HTMLCanvasElement
  resizeElement?: HTMLElement
  rootUrl: string
  nwbtUrl: string
  nwData?: NwData
  tl8?: TranslateService
}
export function createThreeViewer(options: ThreeGameOptions) {
  const engine = new WebGLRenderer({
    canvas: options.canvas,
    // alpha: true,
    // antialias: false,
    // depth: false,
    // stencil: false,
    // precision: 'highp',
    // powerPreference: 'high-performance',
    // premultipliedAlpha: false,
    logarithmicDepthBuffer: true,

    powerPreference: 'high-performance',
    antialias: false,
    stencil: false,
    depth: false,
    alpha: true,
  })

  const game = new GameServiceContainer(null)
    .add(new RendererProvider(engine, options.resizeElement))
    .add(new SceneProvider())
    .add(new ContentProvider(options))
    .add(new InstancedMeshProvider('root instances'))
    .add(new LevelLoader())
    .add(new ThreeViewerBridge(), ViewerBridge)
    .add(new NwDataProvider(options))
    .initialize()

  return game
}
