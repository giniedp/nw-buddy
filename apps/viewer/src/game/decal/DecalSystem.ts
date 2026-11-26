import { GameSystem } from '@gglib/ecs'
import { buildBox, buildGeometry, ResourceScope, type Device, type Geometry } from '@gglib/graphics'
import { mat4CreateScaleXYZ, mat4CreateTranslation, mat4Multiply, vec3, type Mat4 } from '@gglib/math'

/**
 * Bounds of the decal projection in decal space (GetDecalLightProjMatrix of the game): x and y in [-1, 1], z from the
 * far plane -0.5 to the near plane 0.3. The decal matrix maps this box into the world.
 */
export const DECAL_BOX_MIN_Z = -0.5
export const DECAL_BOX_MAX_Z = 0.3

/**
 * Unit box ([-0.5, 0.5]) → decal box, e.g. for debug shapes
 */
export const DECAL_BOX_FROM_UNIT_BOX: Mat4 = mat4Multiply(
  mat4CreateTranslation(vec3(0, 0, (DECAL_BOX_MIN_Z + DECAL_BOX_MAX_Z) * 0.5)),
  mat4CreateScaleXYZ(2, 2, DECAL_BOX_MAX_Z - DECAL_BOX_MIN_Z),
)

/**
 * Shared resources of the projected decals (DecalComponent)
 */
export class DecalSystem extends GameSystem {
  private box: Geometry | null = null
  /**
   * Holds the box for the lifetime of the system, so it is not rebuilt each time the last decal unloads
   */
  private scope = new ResourceScope('DecalSystem')

  public initialize(): void {
    //
  }

  /**
   * The decal box geometry, shared by all decal meshes so that decals with the same material are drawn as one
   * instance batch
   */
  public boxGeometry(device: Device): Geometry {
    if (!this.box || this.box.ownership.isFinalized) {
      this.box = this.scope.adopt(
        buildGeometry(device, buildBox, {
          name: 'DecalBox',
          width: 2,
          height: 2,
          depth: DECAL_BOX_MAX_Z - DECAL_BOX_MIN_Z,
          offset: { x: 0, y: 0, z: (DECAL_BOX_MIN_Z + DECAL_BOX_MAX_Z) * 0.5 },
        }),
      )
    }
    return this.box
  }

  public destroy(): void {
    this.box = null
    this.scope.dispose()
  }
}
