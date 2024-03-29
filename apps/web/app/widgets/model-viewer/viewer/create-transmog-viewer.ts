import { Dyecolors } from '@nw-data/generated'
import 'babylonjs'
import { BABYLON } from 'babylonjs-viewer'
import { registerDyePlugin, updateDyeChannel } from './dye-material-plugin'

export type TransmogViewer = ReturnType<typeof createTransmogViewer>
export function createTransmogViewer(canvas: HTMLCanvasElement) {
  registerDyePlugin()
  const engine = new BABYLON.Engine(canvas, true) // Generate the BABYLON 3D engine

  const createScene = function () {
    const scene = new BABYLON.Scene(engine)
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0)
    scene.environmentIntensity = 1

    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 3,
      2.5,
      new BABYLON.Vector3(0, 1, 0),
      scene,
    )
    camera.minZ = 0.1
    camera.lowerRadiusLimit = 0.5
    camera.wheelPrecision = 100
    camera.attachControl(canvas, true)

    const pipeline = new BABYLON.DefaultRenderingPipeline('default rendering pipeline', true, scene, [camera], true)
    pipeline.fxaaEnabled = true
    pipeline.bloomEnabled = true
    pipeline.imageProcessing.contrast = 1.2
    pipeline.grainEnabled = false

    scene.createDefaultEnvironment({
      createSkybox: false,
      createGround: false,
      // enableGroundMirror: true,
      // enableGroundShadow: true,
      // groundColor: new BABYLON.Color3(0.2,0.2,0.2),
      // groundOpacity: 0.1,
    })
    return scene
  }
  const scene = createScene() //Call the createScene function

  // Register a render loop to repeatedly render the scene
  engine.runRenderLoop(() => {
    scene.render()
  })

  function removeModel(tag: string) {
    if (!tag) {
      throw new Error('tag is required')
    }
    const meshes = scene.getMeshesByTags(tag)
    for (const mesh of meshes) {
      mesh.dispose()
    }
  }

  async function useModel(tag: string, url: string) {
    removeModel(tag)
    if (!url) {
      return
    }
    const result = await BABYLON.SceneLoader.ImportMeshAsync(undefined, '', url, scene)
    for (const mesh of result.meshes) {
      BABYLON.Tags.AddTagsTo(mesh, tag)
    }
  }

  async function takeScreenshot() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    // Create the screenshot
    return new Promise<string>((resolve, reject) => {
      try {
        BABYLON.Tools.CreateScreenshot(engine, scene.cameras[0], { width, height }, resolve)
      } catch (e) {
        reject(e)
      }
    })
  }

  function useDye(
    tag: string,
    options: {
      dyeR: Dyecolors | null
      dyeG: Dyecolors | null
      dyeB: Dyecolors | null
      dyeA: Dyecolors | null
      debugMask: boolean
      dyeEnabled: boolean
    },
  ) {
    updateDyeChannel({
      tag,
      scene: scene,
      dyeR: options.dyeR,
      dyeG: options.dyeG,
      dyeB: options.dyeB,
      dyeA: options.dyeA,
      debugMask: options.debugMask,
      dyeEnabled: true,
    })
  }
  function dispose() {
    engine.stopRenderLoop()
    scene.dispose()
    engine.dispose()
  }

  return {
    resize: () => engine.resize(),
    removeModel,
    useModel,
    useDye,
    dispose,
    takeScreenshot,
  }
}
