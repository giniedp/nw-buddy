import { Camera, Scene, Vector3, VertexData } from "@babylonjs/core";

export function createScreenQuadCamera(scene: Scene) {
  const camera = new Camera('ScreenQuadCamera', new Vector3(0, 0, 0), scene)
  camera.mode = Camera.ORTHOGRAPHIC_CAMERA
  camera.orthoLeft = 0
  camera.orthoRight = 1
  camera.orthoTop = 1
  camera.orthoBottom = 0
  return camera
}

export function createScreenQuad(scene: Scene) {
  const data = new VertexData()
  data.positions = [
    0, 0, 0,
    1, 0, 0,
    0, 1, 0,
    1, 1, 0,
  ]
  data.indices = [0, 1, 2, 2, 1, 3]
  data.uvs = [
    0, 1,
    1, 1,
    0, 0,
    1, 0,
  ]
  return data
}
