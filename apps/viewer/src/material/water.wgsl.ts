/**
 * Water normal map shared by the ocean and water volumes.
 *
 * The engine generates $WaterVolumeDDN with an FFT simulation (WaterVolumesNormalGen), one map used by the ocean
 * and all water volumes. waterDDNWaves is an analytic replacement: a tiling wave sum with the same encoding.
 */
export const WATER_DDN_WGSL = /* wgsl */ `
const ONE_OVER_PI     : f32 = 0.31830988;
const ONE_OVER_TWO_PI : f32 = 0.15915494;
const DDN_GRID_SIZE   : f32 = 64.0;
const DDN_WAVE_COUNT  : i32 = 8;

// waterDDNWaves speed of the game's simulation. The FFT grid has world size 1 (k = 2 PI n for n cycles per tile),
// deep water dispersion w = sqrt(k * 9.81) and runs at 0.125 * time:
// w = 0.125 * sqrt(2 PI * 9.81 * n) = DDN_GAME_SPEED * 2 PI * sqrt(n)
const DDN_GAME_SPEED  : f32 = 0.15617;
const DDN_GAME_AMOUNT : f32 = 1.5;

// Waves tile on the unit square (integer wave numbers).
// Column layout: kx, ky (cycles per tile), amplitude (in texels of a 64 grid), phase
const ddnWaves = array<vec4f, 8>(
  vec4f( 1.0,  2.0, 3.20, 0.0),
  vec4f(-2.0,  1.0, 2.40, 1.7),
  vec4f( 3.0,  1.0, 1.50, 4.1),
  vec4f(-1.0, -4.0, 1.10, 2.3),
  vec4f( 5.0, -2.0, 0.70, 5.2),
  vec4f(-4.0,  5.0, 0.50, 0.9),
  vec4f( 7.0,  3.0, 0.35, 3.6),
  vec4f(-6.0, -7.0, 0.25, 2.8),
);

// Returns the water normal map sample as WaterVolumesNormalGen does:
// xyz = normalize(height delta to +x and +y texel, 8), w = height / 20
// footprint: pixel footprint in uv units, waves above the nyquist limit are faded out like the mip chain does
// speed, amount: wave speed and amplitude scale (ocean animation)
fn waterDDNWaves(uv: vec2f, footprint: f32, timeSec: f32, speed: f32, amount: f32) -> vec4f {
  var h = 0.0;
  var g = vec2f(0.0);
  for (var i = 0; i < DDN_WAVE_COUNT; i++) {
    let w  = ddnWaves[i];
    let kl = length(w.xy);
    let atten = 1.0 - smoothstep(0.25, 0.5, kl * footprint);
    let a     = w.z * amount * atten;
    let phase = 2.0 * PI * dot(w.xy, uv) - speed * sqrt(kl) * 2.0 * PI * timeSec + w.w;
    h += a * sin(phase);
    g += a * cos(phase) * 2.0 * PI * w.xy;
  }
  // p0 - p1 of neighbouring texels is the negative gradient per texel
  let n = normalize(vec3f(-g / DDN_GRID_SIZE, 8.0));
  return vec4f(n, h / 20.0);
}
`
