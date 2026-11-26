export type MtlFlag = number
export const MtlFlag = {
  MTL_FLAG_WIRE: 0x0001, // Use wire frame rendering for this material.
  MTL_FLAG_2SIDED: 0x0002, // Use 2 Sided rendering for this material.
  MTL_FLAG_ADDITIVE: 0x0004, // Use Additive blending for this material.
  //MTL_FLAG_DETAIL_DECAL              : 0x0008,   // UNUSED RESERVED FOR LEGACY REASONS
  MTL_FLAG_LIGHTING: 0x0010, // Should lighting be applied on this material.
  MTL_FLAG_NOSHADOW: 0x0020, // Material do not cast shadows.
  MTL_FLAG_ALWAYS_USED: 0x0040, // When set forces material to be export even if not explicitly used.
  MTL_FLAG_PURE_CHILD: 0x0080, // Not shared sub material, sub material unique to his parent multi material.
  MTL_FLAG_MULTI_SUBMTL: 0x0100, // This material is a multi sub material.
  MTL_FLAG_NOPHYSICALIZE: 0x0200, // Should not physicalize this material.
  MTL_FLAG_NODRAW: 0x0400, // Do not render this material.
  MTL_FLAG_NOPREVIEW: 0x0800, // Cannot preview the material.
  MTL_FLAG_NOTINSTANCED: 0x1000, // Do not instantiate this material.
  MTL_FLAG_COLLISION_PROXY: 0x2000, // This material is the collision proxy.
  MTL_FLAG_SCATTER: 0x4000, // Use scattering for this material
  MTL_FLAG_REQUIRE_FORWARD_RENDERING: 0x8000, // This material has to be rendered in forward rendering passes (alpha/additive blended)
  MTL_FLAG_NON_REMOVABLE: 0x10000, // Material with this flag once created are never removed from material manager (Used for decal materials, this flag should not be saved).
  MTL_FLAG_HIDEONBREAK: 0x20000, // Non-physicalized subsets with such materials will be removed after the object breaks
  MTL_FLAG_UIMATERIAL: 0x40000, // Used for UI in Editor. Don't need show it DB.
  MTL_64BIT_SHADERGENMASK: 0x80000, // ShaderGen mask is remapped
  MTL_FLAG_RAYCAST_PROXY: 0x100000,
  MTL_FLAG_REQUIRE_NEAREST_CUBEMAP: 0x200000, // materials with alpha blending requires special processing for shadows
  MTL_FLAG_CONSOLE_MAT: 0x400000,
  MTL_FLAG_DELETE_PENDING: 0x800000, // Internal use only
  MTL_FLAG_BLEND_TERRAIN: 0x1000000,
  MTL_FLAG_IS_TERRAIN: 0x2000000, // indication to the loader - Terrain type
  MTL_FLAG_IS_SKY: 0x4000000, // indication to the loader - Sky type
  MTL_FLAG_FOG_VOLUME_SHADING_QUALITY_HIGH: 0x8000000, // high vertex shading quality behaves more accurately with fog volumes.
}

export function debugMtlFlags(flags: MtlFlag) {
  const result: string[] = []
  for (const [key, value] of Object.entries(MtlFlag)) {
    if (typeof value === 'number' && (flags & value) !== 0) {
      result.push(key)
    }
  }
  const values = Object.values(MtlFlag)
  let unknownBits: number = 0
  for (let i = 0; i < 64; i++) {
    const bit = 1 << i
    if ((flags & bit) !== 0 && !values.includes(bit)) {
      unknownBits |= bit
    }
  }
  if (unknownBits !== 0) {
    result.push(`Unknown(0x${unknownBits.toString(16)})`)
  }

  return {
    flags: result,
    unknownBits,
  }
}
