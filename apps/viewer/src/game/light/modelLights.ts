import { DEGREE_TO_RAD, mat4Copy, mat4CreateRotationY, mat4Multiply, type Mat4 } from '@gglib/math'
import type { LightData, Model } from '@gglib/model'
import type { ViewerLightConfig } from '../../api'

/**
 * A light of a model (glTF KHR_lights_punctual), placed relative to the model's root
 */
export interface ModelLight {
  name: string
  /**
   * Transform relative to the model's root, oriented for the {@link LightComponent} (emits along local +X)
   */
  local: Mat4
  config: ViewerLightConfig
  /**
   * The track view sequence that switched the light on in the export (`extras.nwSequence`, nwbt `--sequence`)
   */
  sequence?: string
}

/**
 * glTF lights shine along their local -Z axis, the viewer's lights along local +X (CryEngine, see LightComponent).
 * Applied in the light's local space, it turns +X onto -Z.
 */
const LIGHT_FROM_GLTF = mat4CreateRotationY(90 * DEGREE_TO_RAD)

/**
 * The lights of a model with their transforms relative to the model's root. Lights the viewer cannot show
 * (directional) are left out.
 */
export function getModelLights(model: Model): ModelLight[] {
  const result: ModelLight[] = []
  if (!model.lights?.length) {
    return result
  }
  for (const node of model.transformNodes) {
    const index = node.data?.light
    if (index == null || !model.lights[index]) {
      continue
    }
    const config = lightConfigFromData(model.lights[index])
    if (!config) {
      continue
    }
    // the local matrices up to the scene root (the root carries no node data)
    const local = mat4Copy(node.matrix)
    for (let parent = node.parent; parent?.data; parent = parent.parent) {
      mat4Multiply(parent.matrix, local, local)
    }
    mat4Multiply(local, LIGHT_FROM_GLTF, local)
    const sequence = model.lights[index].extras?.['nwSequence'] as string | undefined
    result.push({ name: node.data.name || model.lights[index].name || '', local, config, sequence })
  }
  return result
}

/**
 * The viewer's light of a model light. Lights of nwbt exports carry the game's light in `extras.nwLight` (bulb size,
 * specular, ambient and fog flags, area size, which glTF lights cannot express); other glTF lights map their color,
 * intensity (as the game's diffuse multiplier), range and cone.
 */
export function lightConfigFromData(light: LightData): ViewerLightConfig | null {
  const game = light.extras?.['nwLight'] as ViewerLightConfig | undefined
  if (game?.type) {
    return game
  }
  const color = light.color ?? [1, 1, 1]
  const config: ViewerLightConfig = {
    type: 'Point',
    color: [color[0], color[1], color[2], 1],
    specMultiplier: 1,
    diffuseMultiplier: light.intensity ?? 1,
    attenuation: 0,
    range: light.range ?? 0,
    ambient: false,
    areaWidth: 0,
    areaHeight: 0,
    areaFOV: 0,
    projectorDistance: 0,
    projectorFOV: 0,
    projectorNearPlane: 0,
    maxViewDistance: 0,
    viewDistanceEnabled: false,
    viewDistanceMultiplier: 0,
  }
  switch (light.type) {
    case 'point': {
      return config
    }
    case 'spot': {
      config.type = 'Projector'
      config.projectorDistance = config.range
      config.projectorFOV = ((light.outerConeAngle ?? Math.PI / 4) * 2) / DEGREE_TO_RAD
      return config
    }
    default: {
      return null
    }
  }
}
