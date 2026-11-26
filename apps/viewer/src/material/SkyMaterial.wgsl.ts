import { COMMON_WGSL } from './common.wgsl'

export default /* wgsl */ `

${COMMON_WGSL}

const ENABLE_DAY_GRADIENT   : bool = true;
const ENABLE_MOON           : bool = false;
const ENABLE_NIGHT_GRADIENT : bool = false;
const RT_FOG                : bool = false;
const RT_VOLUMETRIC_FOG     : bool = false;

struct MaterialBlock {

  waveLengthInv     : vec3f, // pow(waveLength * 0.001, -4.0)
  sunIntensity      : vec3f,
  // direction of the actual sun (not the moon at night), same convention as global.sunDirection
  sunDirection      : vec3f,
  mieScattering     : f32, // km
  rayleighScattering: f32, // kr
  phaseAsymmetry    : f32, // g
  // 0 keeps the sky a pixel without geometry for the film mapping
  outputAlpha       : f32,

  nightSkyColBase             : vec3f,
  nightSkyColDelta            : vec3f,
  nightSkyZenithColShift      : vec2f,

  // Moon
  nightMoonDirSize            : vec4f, // xyz = dir, w = size
  nightMoonTexGenRight        : vec3f,
  nightMoonTexGenUp           : vec3f,
  nightMoonColor              : vec3f,
  nightMoonInnerCorona        : vec4f, // xyz = color, w = scale
  nightMoonOuterCorona        : vec4f, // xyz = color, w = scale
};

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;

@group(2) @binding(0) var<uniform>       material: MaterialBlock;
@group(2) @binding(1) var samplerLinear      : sampler;
@group(2) @binding(2) var samplerPoint       : sampler;

@group(3) @binding(0) var moonMap            : texture_2d<f32>;
@group(3) @binding(1) var skyMieMap          : texture_2d<f32>;
@group(3) @binding(2) var skyRayleighMap     : texture_2d<f32>;

struct VertexInput {
  @location(0) position : vec4f,
  @location(2) texture  : vec2f,
};

struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0)       uvPacked : vec4f, // xy = baseTC, zw = moonTC
  @location(1)       skyDir   : vec3f, // to sky, normalized, in world space
  @location(2)       fogColor : vec4f, // xyz = color, w = blend factor
};


@vertex
fn vs_main(in: VertexInput) -> FragmentInput {
    var output : FragmentInput;

    // create rotation matrix by stripping translation from view matrix
    var vPos = vec4f(in.position.xyz, 1.0);
    var viewRot = view.viewMatrix;
    viewRot[3]  = vec4f(0.0, 0.0, 0.0, 1.0);

    output.position   = view.projectionMatrix * viewRot * vPos;
    output.position.z = 0;// output.position.w; // push to far plane

    var skyDir = normalize(in.position.xyz);
    var uvBase = dirToUV(skyDir).xy;
    // the original sky dome is a unit sphere, use the direction so the moon size does not depend on the mesh radius
    var uvMoon = vec2f(
      dot(material.nightMoonTexGenRight.xyz, skyDir),
      dot(material.nightMoonTexGenUp.xyz,    skyDir),
    ) * material.nightMoonDirSize.w + 0.5;

    // Suppress duplicate moon on the opposite hemisphere
    let moonCross = cross(material.nightMoonTexGenRight, material.nightMoonTexGenUp);
    if (dot(moonCross, skyDir) < 0.0) {
      uvMoon *= 1.0e11;
    }

    // Pack both UV pairs: xy = baseTC, zw = moonTC
    output.uvPacked = vec4f(uvBase, uvMoon.x, uvMoon.y);
    output.skyDir = skyDir;

    let viewDirNorm = normalize(in.position.xyz);
    let denom = max(dot(viewDirNorm, view.cameraDirection.xyz), 0.05);
    let viewDirCorrection = 1.0 / denom;
    let worldPos  = view.cameraPosition.xyz + view.far * viewDirNorm * viewDirCorrection;
    output.fogColor = getVolumetricFogColor(worldPos);

    return output;
}

fn getMiePhase(g: f32, cosine: f32) -> f32 {
  let g2 = g * g;
  let miePart = 1.5 * (1.0 - g2) / (2.0 + g2);
  return miePart * (1.0 + (cosine * cosine)) / pow(1.0 + g2 - 2.0 * g * cosine, 1.5);
}

fn getRayleighPhase(cosine: f32) -> f32 {
  return 0.75 * (1.0 + cosine * cosine);
}

fn dirToLatLon(dir: vec3<f32>) -> vec2<f32> {
  let latitude  = acos(dir.z);           // polar angle, [0, PI]
  let longitude = atan2(dir.y, dir.x);   // azimuth, [-PI, PI]
  return vec2<f32>(latitude, longitude);
}

fn dirToUV(dir: vec3<f32>) -> vec2<f32> {
  let ll = dirToLatLon(dir);
  let latitude  = ll.x;
  let longitude = ll.y;

  let u = 0.5 * (1.0 - longitude / PI);
  let v = 2.0 * latitude / PI;

  return vec2<f32>(u, v);
}

@fragment
fn fs_main(in: FragmentInput) -> FragmentOutput {

  let skyDir = normalize(in.skyDir);
  // the sky scatters the actual sun, global.sunDirection is the moon at night
  let sunDir = material.sunDirection;
  let uvBase = in.uvPacked.xy;
  let uvMoon = in.uvPacked.zw;

  let km = material.mieScattering;
  let kr = material.rayleighScattering;
  let g = material.phaseAsymmetry;

  let mieColor      = textureSample(skyMieMap, samplerLinear, uvBase).rgb;
  let rayleighColor = textureSample(skyRayleighMap, samplerLinear, uvBase).rgb;

  let cosAngle      = dot(skyDir, sunDir);
  let miePhase      = getMiePhase(g, cosAngle);
  let rayleighPhase = getRayleighPhase(cosAngle);

  let partialMieConst      = material.sunIntensity * km;
  let partialRayleighConst = material.sunIntensity * kr * material.waveLengthInv;

  let alpha = material.outputAlpha;
  var color = vec3(0.0);
  color += rayleighColor * partialRayleighConst * rayleighPhase;
  color += mieColor * partialMieConst * miePhase;


  // ---- night sky horizontal gradient ----
  var gr = saturate(skyDir.z * material.nightSkyZenithColShift.x + material.nightSkyZenithColShift.y);
      gr = gr * (2.0 - gr);
  color += material.nightSkyColBase.rgb;
  color += material.nightSkyColDelta.rgb * gr;

  // ---- moon ----
  var moonAlbedo = textureSample(moonMap, samplerLinear, uvMoon);
  if (uvMoon.x < 0.0 || uvMoon.x > 1.0 || uvMoon.y < 0.0 || uvMoon.y > 1.0) {
    moonAlbedo.a = 0.0;
  }
  color += material.nightMoonColor * moonAlbedo.rgb * moonAlbedo.a;

  // Inner and outer corona
  let m = 1.0 - dot(skyDir, material.nightMoonDirSize.xyz);
  color += material.nightMoonInnerCorona.rgb * (1.0 / (1.05 + m * material.nightMoonInnerCorona.w));
  color += material.nightMoonOuterCorona.rgb * (1.0 / (1.05 + m * material.nightMoonOuterCorona.w));

  // ---- HDR clamp ----
  color = min(color.rgb, vec3f(16384.0));

  // ---- fog ----
  // in the scene the deferred FogPass fogs the sky like every other pixel (FogPassPS), so the froxel fog in front
  // of the sky applies. Without it (skipFog unset, e.g. probe captures and previews) the sky fogs itself.
  if (global.skipFog == 0u) {
    let worldPos = farPlaneWorldPos(in.position.xy);
    let fog = getSceneFog(worldPos);
    color = color * fog.a + fog.rgb;
  }


  var out: FragmentOutput;
  out.color = vec4f(color, alpha);
  out.depth = view.far;

  switch (global.debug) {
    case DEBUG_V_COLOR0: {
      out.color = vec4f(material.nightSkyColBase.rgb, 1.0);
    }
    case DEBUG_V_COLOR1: {
      //
    }
    case DEBUG_V_UV0: {
      out.color = vec4f(saturate(uvBase.xy), 0.0, 1.0);
    }
    case DEBUG_V_UV1: {
      out.color = vec4f(saturate(uvMoon.xy), 0.0, 1.0);
    }
    default {

    }
  }

  return out;
}


`
