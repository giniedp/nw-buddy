import { FULLSCREEN_WGSL_VS } from '@gglib/effects'
import { VOLUMETRIC_FOG_2_WGSL } from '../../../material/volumetricFog2.wgsl'

/**
 * Deferred volumetric fog, matches `applyFog` in material/common.wgsl.ts
 *
 * Outputs premultiplied fog color and the scene transmittance in alpha.
 * Meant to be used with blending `dst = src.rgb + dst.rgb * src.a`
 */
const FOG_COMMON = /* wgsl */ `
${FULLSCREEN_WGSL_VS}

struct FogParams {
  // view to world transform of the camera
  cameraWorld                    : mat4x4f,
  // mul.xy, add.xy to reconstruct view space xy from uv and linear depth
  ndcToView                      : vec4f,
  // width, height, 1/width, 1/height
  viewport                       : vec4f,
  // x = far plane threshold, pixels at or beyond are the sky / background, y = far plane distance they are fogged at
  depthRange                     : vec4f,
  volumetricFogParams            : vec4f,
  volumetricFogRampParams        : vec4f,
  volumetricFogColorGradientBase : vec4f,
  // x = height gradient scale, y = height gradient offset, z = radial size, w = radial lobe
  volumetricFogColorGradientParams: vec4f,
  volumetricFogColorGradientDelta : vec4f,
  // xyz = radial color, w = 1 / far
  volumetricFogColorGradientRadial: vec4f,
  // xyz = sun direction (light direction, global.sunDirection)
  sunDirection                   : vec4f,
  // volumetric fog 2, see VolFog2Params
  volFog2HeightDensity           : vec4f,
  volFog2Ramp                    : vec4f,
  volFog2Scattering              : vec4f,
  volFog2Blend                   : vec4f,
  fogScatteringColor             : vec4f,
  fogScatteringSecondaryColor    : vec4f,
  volFog2Ambient                 : vec4f,
  volFog2Zenith                  : vec4f,
  // x = 1 when volumetric fog 2 is enabled
  volFog2Enabled                 : vec4f,
  // x = atlas slot of the global probe
  probeGlobal                    : vec4f,
  // rgb = global probe color times the entities fog albedo, w = attenuation
  volFog2Probe                   : vec4f,
  // froxel volume (FroxelFogPass): x = near, y = range - near, z = 1 / (slices - 1), w = 1 / (range - near)
  froxelDepth                    : vec4f,
  // x = 1 when the froxel volume is bound, y = slices, z = screen pixels per froxel
  froxelEnabled                  : vec4f,
};

${VOLUMETRIC_FOG_2_WGSL}

@group(0) @binding(0) var<uniform> params: FogParams;
@group(0) @binding(2) var probeSpecularCubes: texture_cube_array<f32>;
@group(0) @binding(3) var probeSampler: sampler;
@group(0) @binding(4) var froxelVolume: texture_3d<f32>;
@group(0) @binding(5) var froxelSampler: sampler;

// slice texture coordinate of a linear depth (GetVolumetricFogDepthTexcoord, quadratic slices)
fn froxelDepthTexcoord(linearDepth: f32) -> f32 {
  let d = sqrt(max(linearDepth - params.froxelDepth.x, 0.0) * params.froxelDepth.w);
  let slices = params.froxelEnabled.y;
  return ((slices - 1.0) * d + 0.5) / slices;
}

// the integrated froxel volume at a pixel (GetVolumetricFogValue), the range rectified to the view depth
// (RectifyVolumetricFogTexcoordAndRange): rgb = in-scattering, a = transmittance. Same mapping as
// sampleFroxelVolume of the materials: froxel x covers screen pixels [x, x + 1) × tile size.
fn froxelFog(pixel: vec2f, linearDepth: f32, len: f32, range: f32) -> vec4f {
  let rangeDepth = range * linearDepth / len;
  let dims = vec2f(textureDimensions(froxelVolume).xy);
  let tc = vec3f(pixel / (dims * params.froxelEnabled.z), froxelDepthTexcoord(min(rangeDepth, linearDepth)));
  return textureSampleLevel(froxelVolume, froxelSampler, tc, 0.0);
}

fn computeFog(position: vec2f, sceneDepth: f32) -> vec4f {
  if (sceneDepth <= 0.0) {
    return vec4f(0.0, 0.0, 0.0, 1.0);
  }
  // the sky and the background (cleared to the far plane) are fogged at the far plane like FogPassPS, the sky skips
  // its own fog in the scene
  let depth = select(sceneDepth, params.depthRange.y, sceneDepth >= params.depthRange.x);
  let uv = (floor(position) + 0.5) * params.viewport.zw;
  let viewPos = vec3f((params.ndcToView.xy * uv + params.ndcToView.zw) * depth, -depth);
  let cameraToWorldPos = (params.cameraWorld * vec4f(viewPos, 0.0)).xyz;
  if (params.volFog2Enabled.x > 0.5) {
    var p: VolFog2Params;
    p.heightDensity = params.volFog2HeightDensity;
    p.ramp          = params.volFog2Ramp;
    p.scattering    = params.volFog2Scattering;
    p.blend         = params.volFog2Blend;
    p.color1        = params.fogScatteringColor;
    p.color2        = params.fogScatteringSecondaryColor;
    p.ambient       = volFog2ProbeInscatter(
      probeSpecularCubes, probeSampler, params.probeGlobal.x, params.volFog2Probe, params.volFog2Ambient, cameraToWorldPos,
    );
    p.zenith        = params.volFog2Zenith;
    // in-scattering and transmittance, matches the blending dst = src.rgb + dst.rgb * src.a
    if (params.froxelEnabled.x > 0.5) {
      // FogPassPS: the froxel volume up to the ray-marching range, analytical beyond
      let near = froxelFog(floor(position) + 0.5, depth, length(cameraToWorldPos), p.zenith.z);
      let inscatter = volFog2Inscatter(p, cameraToWorldPos, -params.sunDirection.xyz);
      return volFog2WithNear(p, cameraToWorldPos, inscatter, near);
    }
    return volFog2Analytical(p, cameraToWorldPos, -params.sunDirection.xyz);
  }
  // volumetric fog off (config volumetricFog): no fog. The legacy fog is not tuned by New World, it covers the clouds
  return vec4f(0.0, 0.0, 0.0, 1.0);
}
`

export const FOG_WGSL = /* wgsl */ `
${FOG_COMMON}

// @unfilterable
@group(0) @binding(1) var depthMap: texture_2d<f32>;

@fragment
fn fs_main(in: FragmentInput) -> @location(0) vec4f {
  let depth = textureLoad(depthMap, vec2i(in.position.xy), 0).r;
  return computeFog(in.position.xy, depth);
}
`
