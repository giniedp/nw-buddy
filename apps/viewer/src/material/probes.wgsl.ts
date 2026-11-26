/**
 * Environment lighting from the baked probes. Materials call these functions and do not know where the light comes from.
 *
 * Expects `global`, `envMap` and the `lights` block to be declared by the material, `envMap` is the dynamic sky cube of
 * the A/B mode. The placed probes are records of the cluster light list (LightClusterShader.addProbe).
 * `probeSpecularCubes` is declared in common.wgsl, the fog reads it too.
 *
 * Baked cubes are sampled with the plain world direction like the engine (TiledShading.cfi), the sky cube is not
 * baked in that space and needs the conversion in getReflectColor.
 */
export const PROBES_WGSL = /* wgsl */ `
// @block global
// @private
@group(0) @binding(12) var probeDiffuseCubes  : texture_cube_array<f32>;

// TILED_SHADING_SPECPROBE_MAXMIP, the cubes have 7 mips
const PROBE_SPECULAR_MAX_LOD: f32 = 6.0;

// diffuse and specular environment light of a surface, before occlusion and the environment fresnel
struct EnvironmentLight {
  diffuse : vec3f,
  specular: vec3f,
};

// The baked probes at a world position (TiledShading.cfi "Environment probes"): the placed probes of the light
// cluster in blend order, each takes its attenuation of what the ones before left, the global probe the rest.
// backColor > 0 adds the diffuse cube behind the surface (translucent surfaces of the deferred shading).
fn environmentLight(
  cubeSampler: sampler,
  lights: LightBlock,
  worldPos: vec3f,
  normal: vec3f,
  reflection: vec3f,
  gloss: f32,
  backColor: vec3f,
) -> EnvironmentLight {
  var result: EnvironmentLight;
  if (global.probeGlobal.y < 0.5) {
    result.diffuse = getReflectColor(envMap, cubeSampler, normal, 0.0);
    result.specular = getReflectColor(envMap, cubeSampler, reflection, gloss);
    return result;
  }
  let lod = PROBE_SPECULAR_MAX_LOD * (1.0 - gloss);
  var weightSum = 0.0;
  let clusterIndex = getLightClusterIndex(lights, worldPos);
  if (clusterIndex >= 0) {
    let cluster = lightClusters[clusterIndex];
    for (var i = 0u; i < cluster.count && weightSum < 1.0; i++) {
      let probe = lightList[lightIndices[cluster.offset + i].light];
      // the probes come first in a cluster
      if (!lightHasFlag(probe, LIGHT_FLAG_PROBE)) {
        break;
      }
      let attenuation = probeAttenuation(probe, worldPos);
      if (attenuation <= 0.0) {
        continue;
      }
      let weight = (1.0 - weightSum) * attenuation;
      let slot = i32(probe.position.w);
      result.diffuse += probeDiffuse(cubeSampler, normal, slot, backColor) * probe.color.rgb * weight;
      let specular = textureSampleLevel(probeSpecularCubes, cubeSampler, reflection, slot, lod).rgb;
      result.specular += specular * probe.color.rgb * probe.color.w * weight;
      weightSum += weight;
    }
  }
  let rest = max(1.0 - weightSum, 0.0);
  let slot = i32(global.probeGlobal.x);
  result.diffuse += probeDiffuse(cubeSampler, normal, slot, backColor) * global.probeDiffuseColor.rgb * rest;
  let specular = textureSampleLevel(probeSpecularCubes, cubeSampler, reflection, slot, lod).rgb;
  result.specular += specular * global.probeSpecularColor.rgb * rest;
  return result;
}

fn probeDiffuse(cubeSampler: sampler, normal: vec3f, slot: i32, backColor: vec3f) -> vec3f {
  var diffuse = textureSampleLevel(probeDiffuseCubes, cubeSampler, normal, slot, 0.0).rgb;
  if (any(backColor > vec3f(0.0))) {
    diffuse += textureSampleLevel(probeDiffuseCubes, cubeSampler, -normal, slot, 0.0).rgb * backColor;
  }
  return diffuse;
}

// Influence of a probe at a world position (envProbeAttenuation.ts): the position in the box (-1..1, the axes are
// scaled by 1 / extents), mapped to the sphere, smoothstep over the edge falloff (GetAttenuation)
fn probeAttenuation(probe: Light, worldPos: vec3f) -> f32 {
  let d = probe.position.xyz - worldPos;
  let p = vec3f(dot(probe.direction.xyz, d), dot(probe.tangent.xyz, d), dot(probe.params.xyz, d));
  if (max(max(abs(p.x), abs(p.y)), abs(p.z)) >= 1.0) {
    return 0.0;
  }
  let p2 = p * p;
  let s = p * sqrt(vec3f(
    1.0 - 0.5 * p2.y - 0.5 * p2.z + 0.333 * p2.y * p2.z,
    1.0 - 0.5 * p2.z - 0.5 * p2.x + 0.333 * p2.z * p2.x,
    1.0 - 0.5 * p2.x - 0.5 * p2.y + 0.333 * p2.x * p2.y,
  ));
  let t = saturate(saturate(1.0 - dot(s, s)) / probe.tangent.w);
  return t * t * (3.0 - 2.0 * t);
}

// GetEnvmapFresnel (shadelib.cfi), the environment Fresnel of the cluster forward path (ApplyClusterForward_Lights):
// empirical reduced gain at grazing angles for rough materials
fn environmentFresnel(specCol0: vec3f, gloss: f32, NdotE: f32) -> vec3f {
  return mix(specCol0, vec3f(1.0), pow(1.0 - saturate(NdotE), 5.0) / (40.0 - 39.0 * gloss));
}

// DeriveSpecularOcclusion (shadelib.cfi): rough surfaces receive the full ambient occlusion, smooth surfaces more at
// grazing angles and less at normal incidence
fn deriveSpecularOcclusion(NdotV: f32, aoAmount: f32, smoothness: f32) -> f32 {
  return saturate(pow(max(NdotV + aoAmount, 0.0), smoothness) - 1.0 + aoAmount);
}
`
