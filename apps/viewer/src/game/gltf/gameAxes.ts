import { mat4CreateAxisAngle, mat4Multiply, SpaceBasis } from '@gglib/math'

/**
 * The game axes (CryEngine, {@link SpaceBasis.Z_UP_POS_Y}) in the glTF axes of the nwbt exports, which turn them half
 * about up: nwbt writes a game transform M as C · M · C (math.CryToGltfMat4), the game's local frame is node · C
 */
export const GAME_TO_GLTF = mat4Multiply(
  mat4CreateAxisAngle(SpaceBasis.Y_UP_NEG_Z.up, Math.PI),
  SpaceBasis.Z_UP_POS_Y.toViewSpace,
)
