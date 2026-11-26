import { MeshComponent, TransformComponent } from '@gglib/components'
import { GetComponent, type CreateEntityOptions, type GameEntity } from '@gglib/ecs'
import { Mesh, sphereGeometry, type Device } from '@gglib/graphics'
import { mat4CreateRotationX } from '@gglib/math'
import { SkyMaterial } from '../../material'
import type { SkyLightSystem } from './SkyLightSystem'

/**
 * The sky: a sphere with the {@link SkyMaterial}, drawn behind everything. Update it every frame with
 * {@link updateSkySphere}.
 */
export function createSkySphere(parent: GameEntity, device: Device): CreateEntityOptions {
  const geometry = sphereGeometry(device, {
    radius: 128,
    vertexTransform: mat4CreateRotationX(-Math.PI / 2),
  })
  const material = new SkyMaterial(device, { properties: {} })
  return {
    name: `Sky`,
    parent: parent,
    transform: new TransformComponent(),
    components: [
      new MeshComponent({
        mesh: new Mesh(device, {
          materials: [material],
          partImports: [
            {
              geometry: geometry,
              materialIndex: 0,
            },
          ],
        }),
      }),
    ],
  }
}

/**
 * Passes the time of day of the sky light (sky, sun, moon, night sky) to the material of a sky sphere
 */
export function updateSkySphere(entity: GameEntity | null, sky: SkyLightSystem) {
  const mesh = entity?.component<MeshComponent>(MeshComponent, GetComponent.Optional)?.mesh
  if (!mesh) {
    return
  }
  const timeOfDay = sky.timeOfDay
  const material = mesh.materials[0] as SkyMaterial
  material.NightMoonColor = timeOfDay.nightSkyMoonColor
  material.NightMoonInnerCorona = timeOfDay.nightSkyMoonInnerCorona
  material.NightMoonOuterCorona = timeOfDay.nightSkyMoonOuterCorona
  material.NightSkyColBase = timeOfDay.nightSkyHorizonColor
  material.NightSkyColDelta = timeOfDay.nightSkyColorDelta
  material.NightSkyZenithColShift = timeOfDay.nightSkyZenithColorShift

  material.setMoonParams(
    timeOfDay.moonRotationLatitude,
    timeOfDay.moonRotationLongitude,
    timeOfDay.moonSize,
    timeOfDay.moonDirection,
  )
  if (timeOfDay.moonTexture) {
    material.MoonMap = timeOfDay.moonTexture
  }

  material.SkyMieMap = sky.mieScatteringMap
  material.SkyRayleighMap = sky.rayleighScatteringMap
  material.setSkylightParams(
    timeOfDay.skyKM,
    timeOfDay.skyKR,
    timeOfDay.skyG,
    timeOfDay.skyWaveR,
    timeOfDay.skyWaveG,
    timeOfDay.skyWaveB,
    timeOfDay.skySunIntensity,
  )
  material.SunDirection = timeOfDay.skySunDirection
}
