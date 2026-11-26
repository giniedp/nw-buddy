import { COMMON_WGSL } from '../../material/common.wgsl'

/**
 * Sprite particles, a reduced port of cryfx particles.cfx (forward, no tessellation, no shadows).
 *
 * Particles are instanced quads. The emitter computes the oriented axes on the CPU (see ParticleEmitter.writeInstances),
 * so all facing modes (camera, camera X, free …) share this shader.
 */
export default /* wgsl */ `

struct MaterialBlock {
  // x = tiles x, y = tiles y, z = 1 / tiles x, w = 1 / tiles y
  tiles    : vec4f,
  // x = emissive lighting, y = diffuse lighting, z = diffuse backlighting, w = additive (1) or alpha blend (0)
  lighting : vec4f,
  // x = anim blend, y = soft particle, z = color scale, w = unused
  options  : vec4f,
  // rgb = material diffuse color (USE_MATERIAL)
  diffuseColor : vec4f,
  // %SIGNED_DISTANCE_FIELD_2D, x = enabled, y = strength, zw = noise tile
  sdf0     : vec4f,
  // xy = noise speed, zw = noise phase
  sdf1     : vec4f,
  // xy = source tile, zw = source speed
  sdf2     : vec4f,
  // xy = source phase, zw = mask tile
  sdf3     : vec4f,
  // rgb = material emittance (ParticleEmissiveColor), w = TOD brightness influence (fTodBrightnessInfluence)
  emissive : vec4f,
  // %DEFORMATION, x = enabled, y = DeformTile, z = DeformAmount, w = DeformAnimSpeed
  deform   : vec4f,
  // %COLOR_LOOKUP x = enabled, y = ColLookupAmplitude, z = ColLookupColPhase; w = %GLOW_MAP uv: 1 = tiled uv
  // (%_TT_TEXCOORD_MATRIX), 0 = the first texel
  lookup   : vec4f,
  // texture modifiers, only with %_TT_TEXCOORD_MATRIX (any modified slot): _ModifyUV_1 and _ModifyDetailUV
  uvModDiffuse : mat4x4f,
  uvModDetail  : mat4x4f,
}

// @private
@group(0) @binding(0) var<uniform>       global  : GlobalBlock;
// @private
@group(0) @binding(1) var<uniform>       view    : ViewBlock;
// @private
@group(0) @binding(2) var<uniform>       frame   : FrameBlock;

@group(2) @binding(0) var<uniform>       material: MaterialBlock;
@group(2) @binding(1) var samplerLinear  : sampler;
@group(2) @binding(2) var samplerWrap    : sampler;

// @block view
// @unfilterable
@group(1) @binding(8) var sceneDepthMap : texture_2d<f32>;
@group(3) @binding(0) var diffuseMap    : texture_2d<f32>;
@group(3) @binding(1) var sdfNoiseMap   : texture_2d<f32>;
@group(3) @binding(2) var sdfMaskMap    : texture_2d<f32>;
@group(3) @binding(3) var glowMap       : texture_2d<f32>; // %GLOW_MAP $Detail
@group(3) @binding(4) var deformMap     : texture_2d<f32>; // %DEFORMATION $CustomMap (normal map)
@group(3) @binding(5) var lookupMap     : texture_2d<f32>; // %COLOR_LOOKUP $CustomSecondaryMap

struct VertexInput {
  // quad corner in -1..1
  @location(0) corner    : vec2f,
  // xyz = world position, w = tile of the current frame (+ blend to the next frame in the fraction)
  @location(1) iPosition : vec4f,
  // xyz = half extent along the texture u axis, w = tile of the next frame
  @location(2) iAxisX    : vec4f,
  // xyz = half extent along the texture v axis (up), w = soft particle thickness factor
  @location(3) iAxisY    : vec4f,
  // rgb = color, a = alpha
  @location(4) iColor    : vec4f,
  // x = relative particle age 0..1
  @location(5) iExtra    : vec4f,
};

struct FragmentInput {
  @builtin(position) position : vec4f,
  @location(0)       uv0      : vec2f,
  @location(1)       uv1      : vec2f,
  @location(2)       color    : vec4f,
  // x = frame blend, y = soft particle factor
  @location(3)       params   : vec2f,
  @location(4)       uvScreen : vec4f,
  @location(5)       worldPos : vec3f,
  // relative particle age 0..1
  @location(6)       age      : f32,
  // the quad uv before tiling (baseTC.zw)
  @location(7)       uvQuad   : vec2f,
  // emittanceTC: uv of the glow map
  @location(8)       uvGlow   : vec2f,
};

fn tileUv(uv: vec2f, tile: f32) -> vec2f {
  let x = tile % material.tiles.x;
  let y = floor(tile / material.tiles.x);
  return (uv + vec2f(x, y)) * material.tiles.zw;
}

@vertex
fn vs_main(input: VertexInput) -> FragmentInput {
  let worldPos = input.iPosition.xyz + input.iAxisX.xyz * input.corner.x + input.iAxisY.xyz * input.corner.y;
  let clipPos = view.projectionMatrix * view.viewMatrix * vec4f(worldPos, 1.0);

  // v runs top down, the axis Y points up
  let uv = vec2f(input.corner.x * 0.5 + 0.5, 0.5 - input.corner.y * 0.5);
  let frame0 = floor(input.iPosition.w);

  var output: FragmentInput;
  output.position = clipPos;
  output.uv0 = tileUv(uv, frame0);
  output.uv1 = tileUv(uv, input.iAxisX.w);
  output.uvQuad = uv;
  output.uvGlow = vec2f(0.0);
  // Particle_Convert_TC: the modifiers apply to the tiled uv, the glow uv is computed before the diffuse modifier
  if (material.lookup.w > 0.0) {
    output.uvGlow = (material.uvModDetail * vec4f(output.uv0, 0.0, 1.0)).xy;
    output.uv0 = (material.uvModDiffuse * vec4f(output.uv0, 0.0, 1.0)).xy;
    output.uv1 = (material.uvModDiffuse * vec4f(output.uv1, 0.0, 1.0)).xy;
  }
  output.color = input.iColor;
  output.params = vec2f(input.iPosition.w - frame0, input.iAxisY.w);
  output.uvScreen = clipPosToSceenUv(clipPos);
  output.worldPos = worldPos;
  output.age = input.iExtra.x;
  return output;
}

// %SIGNED_DISTANCE_FIELD_2D (particles.cfi, FXSDFFloatDomain): the diffuse map tiles and scrolls through the sprite,
// distorted by a scrolling noise, the sprite shape comes from the mask. The noise scrolls with the time
// (PerFrame_Time.x), the source with the relative particle age.
fn sampleSdfDiffuse(uv: vec2f, age: f32) -> vec4f {
  let noiseUv = uv * material.sdf0.zw + frame.elapsedTime * material.sdf1.xy + material.sdf1.zw;
  let sdf = textureSample(sdfNoiseMap, samplerWrap, noiseUv).x * material.sdf0.y;
  let sourceUv = uv * material.sdf2.xy + vec2f(sdf) + age * material.sdf2.zw + material.sdf3.xy;
  var tex = textureSample(diffuseMap, samplerWrap, sourceUv);
  tex.a *= textureSample(sdfMaskMap, samplerLinear, uv * material.sdf3.zw).r;
  return tex;
}

// %DEFORMATION (ApplyTexCoordsDeformation): offset of the diffuse uv from two scrolling normal map lookups over the quad
fn deformOffset(uvQuad: vec2f) -> vec2f {
  let tcAnim = frame.elapsedTime * material.deform.w * vec4f(0.9, 0.9, 2.0, 2.0) + vec4f(0.5, 0.5, 0.75, 1.0);
  let tcBump = (uvQuad.xyxy - 0.5) * material.deform.y * vec4f(1.0, 1.0, 2.0, 2.0) + tcAnim;
  let bump = textureSample(deformMap, samplerWrap, tcBump.xy).xy + textureSample(deformMap, samplerWrap, tcBump.zw).xy;
  return bump * material.deform.z;
}

// %COLOR_LOOKUP (ApplyColorLookup): the color from a gradient by the luminance
fn colorLookup(c: vec4f) -> vec4f {
  let lum = dot(c.rgb, vec3f(0.333));
  let lookup = textureSample(lookupMap, samplerWrap, vec2f(material.lookup.z * lum)).rgb;
  return vec4f(saturate(c.a * material.lookup.y * lookup), c.a);
}

@fragment
fn fs_main(input: FragmentInput) -> FragmentOutput {
  // the deformation moves the current tile only, not the blended next tile
  var uv0 = input.uv0;
  if (material.deform.x > 0.0) {
    uv0 += deformOffset(input.uvQuad);
  }
  var tex = textureSample(diffuseMap, samplerLinear, uv0);
  let tex1 = textureSample(diffuseMap, samplerLinear, input.uv1);
  var glow = textureSample(glowMap, samplerWrap, input.uvGlow);
  let glow1 = textureSample(glowMap, samplerWrap, input.uv1);
  if (material.options.x > 0.0) {
    tex = mix(tex, tex1, input.params.x);
    glow = mix(glow, glow1, input.params.x);
  }
  let sdfTex = sampleSdfDiffuse(uv0, input.age);
  if (material.sdf0.x > 0.0) {
    tex = sdfTex;
  }
  let lookedUp = colorLookup(tex);
  if (material.lookup.x > 0.0) {
    tex = lookedUp;
  }

  // debug views, options.w: 1 = quad coverage, 2 = texture color, 3 = texture alpha
  if (material.options.w > 0.0) {
    var debug: FragmentOutput;
    debug.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);
    switch (u32(material.options.w)) {
      case 1u: { debug.color = vec4f(1.0, 0.0, 1.0, 1.0); }
      case 2u: { debug.color = vec4f(tex.rgb, 1.0); }
      default: { debug.color = vec4f(vec3f(tex.a), 1.0); }
    }
    return debug;
  }

  // early alpha clip of the texture like the original, the residual alpha of the textures is visible with
  // high emissive values otherwise
  if (tex.a <= 0.01) {
    discard;
  }
  var alpha = saturate(tex.a * input.color.a);

  // ambient of the engine: emissive + ambient * diffuse lighting (ParticleContainer m_AmbColor), plus a sun term
  let ambient = globalProbeAmbient(input.worldPos - view.cameraPosition.xyz);
  let sun = global.sunColor.rgb * mix(0.25, 0.5, material.lighting.z);
  let lit = vec3f(material.lighting.x) + (ambient + sun) * material.lighting.y;
  let diffuse = tex.rgb * material.diffuseColor.rgb;
  var color = diffuse * input.color.rgb * lit * material.options.z;
  // the emission of the material: not tinted by the particle color, the glow map defaults to white
  color += alpha * diffuse * glow.rgb * material.emissive.rgb;
  // ParticleTimeOfDay with r_ParticlesTOD 2: lit and emission scale by the TOD particle brightness
  color *= (global.particleBrightness - 1.0) * material.emissive.w + 1.0;

  if (material.options.y > 0.0) {
    let sceneDepth = sampleSceneDepth(input.uvScreen, sceneDepthMap);
    let dist = max(min(sceneDepth - input.uvScreen.w, input.uvScreen.w), 0.0);
    let soft = 1.0 - exp(-dist * dist * input.params.y);
    alpha *= soft;
  }

  // fog over the premultiplied color: additive particles only get the transmittance
  if (global.skipFog == 0u) {
    let fog = getSceneFog(input.worldPos);
    if (material.lighting.w > 0.0) {
      color *= fog.a;
    } else {
      color = color * fog.a + fog.rgb;
    }
  }

  var out: FragmentOutput;
  // premultiplied alpha, additive particles keep the destination alpha
  out.color = vec4f(color * alpha, select(alpha, 0.0, material.lighting.w > 0.0));
  out.depth = linearizeDepthReversedZ(input.position.z, view.near, view.far);
  return out;
}

${COMMON_WGSL}
`
