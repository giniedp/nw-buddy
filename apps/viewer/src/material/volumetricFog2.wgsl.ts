/**
 * Analytical volumetric fog 2 (GetVolumetricFogAnalyticalColor in VolumetricFog.cfi).
 *
 * New World renders fog with volumetric fog 2: ray-marched froxels near the camera and this analytical solution
 * beyond. The viewer has no froxel volume, the analytical solution covers the full span (fullSpan in the original).
 *
 * Parameters are computed like the sGetVolumetricFog* functions in D3DHWShader.cpp, see TimeOfDay.
 * The caller provides the global environment probe in-scattering in `ambient`, see volFog2ProbeInscatter.
 * Includes the New World zenith fade (GetZenithFadeAmount), which thins the fog when looking up.
 */
export const VOLUMETRIC_FOG_2_WGSL = /* wgsl */ `
// Mip of the 256² specular probe cube the fog samples. The game binds a 128² cube with 6 mips to the fog pass
// (GPA capture), Lumberyard's CVolumetricFog takes the diffuse cube instead.
const VOLFOG2_PROBE_LOD: f32 = 1.0;

// Isotropic in-scattering of the global environment probe along the view ray (GetVolumetricFogAnalyticalColor,
// ENABLE_GLOBAL_ENV_PROBE_FOR_ANALYTICAL_FOG). probe: rgb = probe color times the entities fog albedo,
// w = attenuation, falls back to the constant stand-in without a baked probe.
fn volFog2ProbeInscatter(
  cubes: texture_cube_array<f32>,
  cubeSampler: sampler,
  slot: f32,
  probe: vec4f,
  fallback: vec4f,
  ray: vec3f,
) -> vec4f {
  if (probe.w <= 0.0) {
    return fallback;
  }
  let cube = textureSampleLevel(cubes, cubeSampler, ray, i32(slot), VOLFOG2_PROBE_LOD).rgb;
  return vec4f(cube * probe.rgb * probe.w / (4.0 * 3.14159265), 0.0);
}

struct VolFog2Params {
  // x = height scale, y = log2(e) * density at viewer height, z = analytical fog visibility, w = final density clamp
  heightDensity: vec4f,
  // x = ramp start, y = ramp end
  ramp         : vec4f,
  // x = in-scattering, y = extinction, z = anisotropy k (atmosphere), w = 1 - k * k
  scattering   : vec4f,
  // x = blend factor of the sun radial lobes, y = blend mode
  blend        : vec4f,
  // rgb = sun color * fog albedo (atmosphere), w = anisotropy k (sun radial)
  color1       : vec4f,
  // rgb = sun color * fog albedo (sun radial), w = 1 - k * k (sun radial)
  color2       : vec4f,
  // rgb = isotropic in-scattering of the global environment probe along this ray, see volFog2ProbeInscatter
  ambient      : vec4f,
  // x = zenith fade factor, y = zenith fade curve (exponent), PerFrame_VolumetricFogDistributionParams.xw
  // z = ray-marching range, the froxel volume of the original (PerFrame_VolumetricFogDistanceParams.w)
  zenith       : vec4f,
};

// GetZenithFadeAmount: amount of fog removed when looking up, 0 at and below the horizon
fn volFog2ZenithFade(factor: f32, curve: f32, viewUp: f32) -> f32 {
  if (viewUp < 0.0 || factor <= 0.0) {
    return 0.0;
  }
  // pushes the fog up from the horizon for a smoother transition
  let up = pow(min(1.0, viewUp), 2.0);
  let fade = pow(saturate(1.0 - up), curve);
  return factor - factor * fade;
}

// (e^x - 1) / x, stable near 0
fn volFog2Expm1OverX(x: f32) -> f32 {
  if (abs(x) < 0.05) {
    return 1.0 + x * (1.0 / 2.0 + x * (1.0 / 6.0 + x * (1.0 / 24.0 + x / 120.0)));
  }
  return (exp(x) - 1.0) / x;
}

// (e^x * (x - 1) + 1) / x^2, stable near 0. s^2 * phi(LM * s) = integral of u * e^(LM * u) du over [0, s]
fn volFog2RampPhi(x: f32) -> f32 {
  if (abs(x) < 0.1) {
    return 1.0 / 2.0 + x * (1.0 / 3.0 + x * (1.0 / 8.0 + x * (1.0 / 30.0 + x / 144.0)));
  }
  return (exp(x) * (x - 1.0) + 1.0) / (x * x);
}

fn volFog2SchlickPhase(dotLE: f32, k: f32, oneMinusK2: f32) -> f32 {
  let h = -((k * dotLE) - 1.0);
  return oneMinusK2 / (4.0 * 3.14159265 * h * h);
}

// Fog of the ray segment from transitionDistance to d (distances scaled by the fog distance scale), the body of
// GetVolumetricFogAnalyticalColor without the zenith fade. densityScale scales the extinction (froxel zenith fade).
// Returns rgb = in-scattered light, a = transmittance
fn volFog2Segment(p: VolFog2Params, LM: f32, d: f32, transitionDistance: f32, densityScale: f32, inscatter: vec3f) -> vec4f {
  let rampStart = p.ramp.x;
  let rampEnd = p.ramp.y;

  // The original divides differences of nearly equal exponentials by LM (and LM^2 in the ramp), clamping LM away
  // from 0. Close to the horizon (LM -> 0) that cancels catastrophically in f32 and the clamp flips the sign,
  // which shows as a line along the horizon. Same integrals here, factored into forms that are stable at LM = 0.
  let extDensity = p.scattering.y * p.heightDensity.y * densityScale;

  let d2 = min(transitionDistance, d);
  let minD = min(d, select(transitionDistance, rampStart, transitionDistance < rampStart));
  let maxD = min(d, rampEnd);
  let sd = max(rampEnd, d2);

  // transmittance from ramp end to the end of depth
  // original: exp2(-extDensity / LM * (e^(LM * d) - e^(LM * sd)))
  let T0 = saturate(exp2(-extDensity * exp(LM * sd) * (d - sd) * volFog2Expm1OverX(LM * (d - sd))));
  var fog = vec4f(0.0, 0.0, 0.0, T0);

  var trns = 1.0;
  if (rampEnd - rampStart > 1.0 && transitionDistance < rampEnd) {
    // optical depth of the ramped density from ramp start to t: extDensity * integral of e^(LM * u) * (u - rampStart) / (rampEnd - rampStart)
    // original: cCC * (A(t) - A(rampStart)) with A(t) = e^(LM * t) * (LM * (rampStart - t) + 1), cCC = -extDensity / (LM^2 * (rampStart - rampEnd))
    let rampScale = extDensity * exp(LM * rampStart) / (rampEnd - rampStart);
    let sMax = maxD - rampStart;
    let sMin = minD - rampStart;
    let tauMax = rampScale * sMax * sMax * volFog2RampPhi(LM * sMax);
    let tauMin = rampScale * sMin * sMin * volFog2RampPhi(LM * sMin);

    // transmittance with depth based ramp from ramp start to ramp end
    trns = saturate(exp2(tauMin - tauMax));
    fog.a *= trns;

    // in-scattering with depth based ramp
    fog = vec4f(fog.rgb + inscatter * saturate(exp2(-tauMin) - exp2(-tauMax)), fog.a);
  }

  // in-scattering from ramp end to the end of depth
  return vec4f(fog.rgb + trns * inscatter * (1.0 - T0), fog.a);
}

// Returns rgb = in-scattered light, a = transmittance, apply as color * fog.a + fog.rgb
// sunDir points towards the sun (light)
//
// The game ray-marches froxels up to the ray-marching range and continues analytically beyond (FogPassPS:
// BlendVolumetricFogWithGlobalFog). The viewer evaluates the near segment analytically as well, but fades it
// like the froxels: the zenith fade scales the density (GetExponentialHeightFogDensity) instead of blending
// the result towards no fog, and the analytical visibility does not apply.
fn volFog2Analytical(p: VolFog2Params, cameraToWorldPos: vec3f, sunDir: vec3f) -> vec4f {
  let len = max(length(cameraToWorldPos), 1e-4);
  let LM = p.heightDensity.x * cameraToWorldPos.z / len;
  let range = p.zenith.z;
  let inscatter = volFog2Inscatter(p, cameraToWorldPos, sunDir);
  // near segment (froxels in the game), view up from the linear depth like the froxels
  let nearFade = volFog2ZenithFade(p.zenith.x, p.zenith.y, cameraToWorldPos.z / len);
  let near = volFog2Segment(p, LM, min(len, range), 0.1, 1.0 - nearFade, inscatter);
  return volFog2WithNear(p, cameraToWorldPos, inscatter, near);
}

// Analytical in-scattering along the view ray: sun lobes (GetVolumetricFogInscatteringSun) scaled by in-scattering /
// extinction, plus the global probe
fn volFog2Inscatter(p: VolFog2Params, cameraToWorldPos: vec3f, sunDir: vec3f) -> vec3f {
  let dotLE = dot(sunDir, normalize(cameraToWorldPos));
  let ins0 = volFog2SchlickPhase(dotLE, p.scattering.z, p.scattering.w) * p.color1.rgb;
  let ins1 = volFog2SchlickPhase(dotLE, p.color1.w, p.color2.w) * p.color2.rgb;
  var inscatter = ins0 * (1.0 - p.blend.x * p.blend.y) + ins1 * p.blend.x;
  inscatter *= p.scattering.x / p.scattering.y;
  // global environment probe in-scattering (isotropic, added after the scattering scale as in the original)
  return inscatter + p.ambient.rgb;
}

// Fog with a given near segment up to the ray-marching range (the froxel sample in FogPassPS, or the analytical
// near segment): adds the analytical fog beyond the range (BlendVolumetricFogWithGlobalFog without the overlap,
// ENABLE_OVERLAP_ANALYTICAL_FOG is off in New World) and the final density clamp.
// Returns rgb = in-scattered light, a = transmittance, apply as color * fog.a + fog.rgb
fn volFog2WithNear(p: VolFog2Params, cameraToWorldPos: vec3f, inscatter: vec3f, near: vec4f) -> vec4f {
  // the original scales lengthToTarget by PerFrame_FogDistanceScale.x, which is 1 in all GPA captures
  let d = max(length(cameraToWorldPos), 1e-4);
  let LM = p.heightDensity.x * cameraToWorldPos.z / d;
  let range = p.zenith.z;
  var fog = near;

  if (d > range) {
    // far segment (GetVolumetricFogAnalyticalColor with the ray-marching range as transition distance)
    var far = volFog2Segment(p, LM, d, range, 1.0, inscatter);
    // zenith fade (end of GetVolumetricFogAnalyticalColor)
    let zenithFade = volFog2ZenithFade(p.zenith.x, p.zenith.y, cameraToWorldPos.z / d);
    far = vec4f(mix(far.rgb, vec3f(0.0), zenithFade), mix(far.a, 1.0, zenithFade));
    // BlendVolumetricFogWithGlobalFog: analytical fog visibility, behind the near segment
    fog = vec4f(fog.rgb + p.heightDensity.z * fog.a * far.rgb, fog.a * far.a);
  }

  // ClampFinalFogDensity
  let clampTransmittance = p.heightDensity.w;
  fog = vec4f(fog.rgb * (1.0 - clampTransmittance), max(fog.a, clampTransmittance));
  return fog;
}
`
