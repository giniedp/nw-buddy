import { Color } from '@gglib/graphics'
import { vec3, type IVec3 } from '@gglib/math'

export type TodParam<T extends IVec3 | number> = {
  name: string
  group: string
  displayName: string
  type: 'color' | 'value'
  value: T
  min: number
  max: number
  spline?: TodSpline
}

function color(group: string, displayName: string, name: string, value: IVec3): TodParam<IVec3> {
  return { group, displayName, name, value, min: 0.0, max: 1.0, type: 'color' }
}

function value<T extends IVec3 | number>(
  group: string,
  displayName: string,
  name: string,
  value: T,
  min: number,
  max: number,
): TodParam<T> {
  return { group, displayName, name, value, min, max, type: 'value' }
}

// prettier-ignore
export const TodParams = {
  SUN_COLOR: color("Sun", "", "Sun color", Color.fromBytes(255, 248, 248, 255).toVec3()),
  SUN_INTENSITY: value("Sun", "Sun intensity (lux)", "Sun intensity", 119000.0, 0.0, 550000.0),
  SUN_SPECULAR_MULTIPLIER: value("Sun", "", "Sun specular multiplier", 1.0, 0.0, 4.0),

  // New World: scale the baked environment probes, the cubes do not change over the day
  ENV_PROBE_MULTIPLIER: color("Environment probes", "Multiplier", "Environment Probe Multiplier", vec3(1.0)),
  ENV_PROBE_DIFFUSE_MULTIPLIER: value("Environment probes", "Diffuse multiplier", "Environment Probe Diffuse Multiplier", 1.0, 0.0, 16.0),
  ENV_PROBE_SPECULAR_MULTIPLIER: value("Environment probes", "Specular multiplier", "Environment Probe Specular Multiplier", 1.0, 0.0, 16.0),

  FOG_COLOR: color("Fog", "Color (bottom)", "Fog color", vec3(0.0)),
  FOG_COLOR_MULTIPLIER: value("Fog", "Color (bottom) multiplier", "Fog color multiplier", 0.0, 0.0, 16.0),
  VOLFOG_HEIGHT: value("Fog", "Height (bottom)", "Fog height (bottom)", 0.0, -5000.0, 30000.0),
  VOLFOG_DENSITY: value("Fog", "Density (bottom)", "Fog layer density (bottom)", 1.0, 0.0, 1.0),

  FOG_COLOR2: color("Fog", "Color (top)", "Fog color (top)", vec3(0.0)),
  FOG_COLOR2_MULTIPLIER: value("Fog", "Color (top) multiplier", "Fog color (top) multiplier", 0.0, 0.0, 16.0),
  VOLFOG_HEIGHT2: value("Fog", "Height (top)", "Fog height (top)", 4000.0, -5000.0, 30000.0),
  VOLFOG_DENSITY2: value("Fog", "Density (top)", "Fog layer density (top)", 0.0, 0.0, 1.0),
  VOLFOG_HEIGHT_OFFSET: value("Fog", "Color height offset", "Fog color height offset", 0.0, -1.0, 1.0),

  FOG_RADIAL_COLOR: color("Fog", "Color (radial)", "Fog color (radial)", vec3(0.0)),
  FOG_RADIAL_COLOR_MULTIPLIER: value("Fog", "Color (radial) multiplier", "Fog color (radial) multiplier", 0.0, 0.0, 16.0),
  VOLFOG_RADIAL_SIZE: value("Fog", "Radial size", "Fog radial size", 0.75, 0.0, 1.0),
  VOLFOG_RADIAL_LOBE: value("Fog", "Radial lobe", "Fog radial lobe", 0.5, 0.0, 1.0),

  VOLFOG_GLOBAL_DENSITY: value("Fog", "Global density", "Volumetric fog: Global density", 0.02, 0.0, 100.0),
  VOLFOG_FINAL_DENSITY_CLAMP: value("Fog", "Final density clamp", "Volumetric fog: Final density clamp", 1.0, 0.0, 1.0),

  VOLFOG_RAMP_START: value("Fog", "Ramp start", "Volumetric fog: Ramp start", 0.0, 0.0, 30000.0),
  VOLFOG_RAMP_END: value("Fog", "Ramp end", "Volumetric fog: Ramp end", 100.0, 0.0, 30000.0),
  VOLFOG_RAMP_INFLUENCE: value("Fog", "Ramp influence", "Volumetric fog: Ramp influence", 0.0, 0.0, 1.0),

  VOLFOG_SHADOW_DARKENING: value("Fog", "Shadow darkening", "Volumetric fog: Shadow darkening", 0.25, 0.0, 1.0),
  VOLFOG_SHADOW_DARKENING_SUN: value("Fog", "Shadow darkening sun", "Volumetric fog: Shadow darkening sun", 1.0, 0.0, 1.0),
  VOLFOG_SHADOW_DARKENING_AMBIENT: value("Fog", "Shadow darkening ambient", "Volumetric fog: Shadow darkening ambient", 1.0, 0.0, 1.0),
  VOLFOG_SHADOW_RANGE: value("Fog", "Shadow range", "Volumetric fog: Shadow range", 0.1, 0.0, 1.0),

  VOLFOG2_HEIGHT: value("Volumetric fog", "Height (bottom)", "Volumetric fog 2: Fog height (bottom)", 0.0, -5000.0, 30000.0),
  VOLFOG2_DENSITY: value("Volumetric fog", "Density (bottom)", "Volumetric fog 2: Fog layer density (bottom)", 1.0, 0.0, 1.0),
  VOLFOG2_HEIGHT2: value("Volumetric fog", "Height (top)", "Volumetric fog 2: Fog height (top)", 4000.0, -5000.0, 30000.0),
  VOLFOG2_DENSITY2: value("Volumetric fog", "Density (top)", "Volumetric fog 2: Fog layer density (top)", 0.0001, 0.0, 1.0),
  VOLFOG2_GLOBAL_DENSITY: value("Volumetric fog", "Global density", "Volumetric fog 2: Global fog density", 0.1, 0.0, 100.0),
  VOLFOG2_RAMP_START: value("Volumetric fog", "Ramp start", "Volumetric fog 2: Ramp start", 0.0, 0.0, 30000.0),
  VOLFOG2_RAMP_END: value("Volumetric fog", "Ramp end", "Volumetric fog 2: Ramp end", 0.0, 0.0, 30000.0),
  VOLFOG2_COLOR1: color("Volumetric fog", "Color (atmosphere)", "Volumetric fog 2: Fog albedo color (atmosphere)", vec3(1.0)),
  VOLFOG2_ANISOTROPIC1: value("Volumetric fog", "Anisotropy (atmosphere)", "Volumetric fog 2: Anisotropy factor (atmosphere)", 0.2, -1.0, 1.0),
  VOLFOG2_COLOR2: color("Volumetric fog", "Color (sun radial)", "Volumetric fog 2: Fog albedo color (sun radial)", vec3(1.0)),
  VOLFOG2_ANISOTROPIC2: value("Volumetric fog", "Anisotropy (sun radial)", "Volumetric fog 2: Anisotropy factor (sun radial)", 0.95, -1.0, 1.0),
  VOLFOG2_BLEND_FACTOR: value("Volumetric fog", "Radial blend factor", "Volumetric fog 2: Blend factor for sun scattering", 1.0, 0.0, 1.0),
  VOLFOG2_BLEND_MODE: value("Volumetric fog", "Radial blend mode", "Volumetric fog 2: Blend mode for sun scattering", 0.0, 0.0, 1.0),
  VOLFOG2_RANGE: value("Volumetric fog", "Range", "Volumetric fog 2: Maximum range of ray-marching", 64.0, 0.0, 8192.0),
  VOLFOG2_INSCATTER: value("Volumetric fog", "In-scattering", "Volumetric fog 2: In-scattering factor", 1.0, 0.0, 100.0),
  VOLFOG2_EXTINCTION: value("Volumetric fog", "Extinction", "Volumetric fog 2: Extinction factor", 0.3, 0.0, 100.0),
  VOLFOG2_COLOR: color("Volumetric fog", "Color (entities)", "Volumetric fog 2: Fog albedo color (entities)", vec3(1.0)),
  VOLFOG2_ANISOTROPIC: value("Volumetric fog", "Anisotropy (entities)", "Volumetric fog 2: Anisotropy factor (entities)", 0.6, -1.0, 1.0),
  VOLFOG2_GLOBAL_FOG_VISIBILITY: value("Volumetric fog", "Analytical fog visibility", "Volumetric fog 2: Analytical volumetric fog visibility", 0.5, 0.0, 1.0),
  // New World: fade the analytical fog towards the zenith (GetZenithFadeAmount in volumetricfog.cfi)
  VOLFOG2_ZENITH_FADE_FACTOR: value("Volumetric fog", "Zenith fade factor", "Volumetric fog 2: Zenith Fade Factor", 0.0, 0.0, 1.0),
  VOLFOG2_ZENITH_FADE_CURVE: value("Volumetric fog", "Zenith fade curve", "Volumetric fog 2: Zenith Fade Curve", 0.5, 0.0, 1.0),
  // New World: the global wind (SetWind, PerFrame_WindDirection), defaults of libs/timeofday/default.xml
  WIND_X: value("Environment", "Wind X", "Environment Wind X Vector", -2.5, -100.0, 100.0),
  WIND_Y: value("Environment", "Wind Y", "Environment Wind Y Vector", 2.0, -100.0, 100.0),
  WIND_Z: value("Environment", "Wind Z", "Environment Wind Z Vector", 0.5, -100.0, 100.0),
  // New World: brightness of the particles (Engine global parameter 76, ParticleParams3[1] in particlestod.cfi)
  PARTICLE_BRIGHTNESS: value("Advanced", "Particle brightness", "Particle Brightness Multiplier", 1.0, 0.0, 2.0),
  VOLFOG2_FINAL_DENSITY_CLAMP: value("Volumetric fog", "Final density clamp", "Volumetric fog 2: Final density clamp", 1.0, 0.0, 1.0),

  SKYLIGHT_SUN_INTENSITY: color("Sky Light", "Sun intensity", "Sky light: Sun intensity", vec3(1.0)),
  SKYLIGHT_SUN_INTENSITY_MULTIPLIER: value("Sky Light", "Sun intensity multiplier", "Sky light: Sun intensity multiplier", 50.0, 0.0, 1000.0),
  SKYLIGHT_KM: value("Sky Light", "Mie scattering", "Sky light: Mie scattering", 4.8, 0.0, 1000.0),
  SKYLIGHT_KR: value("Sky Light", "Rayleigh scattering", "Sky light: Rayleigh scattering", 2.0, 0.0, 1000.0),
  SKYLIGHT_G: value("Sky Light", "Sun anisotropy factor", "Sky light: Sun anisotropy factor", -0.997, -0.9999, 0.9999),
  SKYLIGHT_WAVELENGTH_R: value("Sky Light", "Wavelength (R)", "Sky light: Wavelength (R)", 694.0, 380.0, 780.0),
  SKYLIGHT_WAVELENGTH_G: value("Sky Light", "Wavelength (G)", "Sky light: Wavelength (G)", 597.0, 380.0, 780.0),
  SKYLIGHT_WAVELENGTH_B: value("Sky Light", "Wavelength (B)", "Sky light: Wavelength (B)", 488.0, 380.0, 780.0),

  NIGHSKY_HORIZON_COLOR: color("Night Sky", "Horizon color", "Night sky: Horizon color", Color.fromBytes(222.0, 148.0, 47.0, 255).toVec3()),
  NIGHSKY_ZENITH_COLOR: color("Night Sky", "Zenith color", "Night sky: Zenith color", Color.fromBytes(17.0, 38.0, 78.0, 255).toVec3()),
  NIGHSKY_ZENITH_SHIFT: value("Night Sky", "Zenith shift", "Night sky: Zenith shift", 0.25, 0.0, 16.0),
  NIGHSKY_START_INTENSITY: value("Night Sky", "Star intensity", "Night sky: Star intensity", 0.01, 0.0, 16.0),
  NIGHSKY_MOON_COLOR: color("Night Sky", "Moon color", "Night sky: Moon color", Color.fromBytes(255.0, 255.0, 255.0, 255).toVec3()),
  NIGHSKY_MOON_INNERCORONA_COLOR: color("Night Sky", "Moon inner corona color", "Night sky: Moon inner corona color", Color.fromBytes(230.0, 255.0, 255.0, 255).toVec3()),
  NIGHSKY_MOON_INNERCORONA_SCALE: value("Night Sky", "Moon inner corona scale", "Night sky: Moon inner corona scale", 0.499, 0.0, 2.0),
  NIGHSKY_MOON_OUTERCORONA_COLOR: color("Night Sky", "Moon outer corona color", "Night sky: Moon outer corona color", Color.fromBytes(128.0, 200.0, 255.0, 255).toVec3()),
  NIGHSKY_MOON_OUTERCORONA_SCALE: value("Night Sky", "Moon outer corona scale", "Night sky: Moon outer corona scale", 0.006, 0.0, 2.0),

  NIGHSKY_HORIZON_COLOR_MULTIPLIER: value("Night Sky Multiplier", "Horizon color", "Night sky: Horizon color multiplier", 0.0001, 0.0, 1.0),
  NIGHSKY_ZENITH_COLOR_MULTIPLIER: value("Night Sky Multiplier", "Zenith color", "Night sky: Zenith color multiplier", 0.00002, 0.0, 1.0),
  NIGHSKY_MOON_COLOR_MULTIPLIER: value("Night Sky Multiplier", "Moon color", "Night sky: Moon color multiplier", 0.01, 0.0, 1.0),
  NIGHSKY_MOON_INNERCORONA_COLOR_MULTIPLIER: value("Night Sky Multiplier", "Moon inner corona color", "Night sky: Moon inner corona color multiplier", 0.0001, 0.0, 1.0),
  NIGHSKY_MOON_OUTERCORONA_COLOR_MULTIPLIER: value("Night Sky Multiplier", "Moon outer corona color", "Night sky: Moon outer corona color multiplier", 0.00005, 0.0, 1.0),

  HDR_FILMCURVE_SHOULDER_SCALE: value("HDR", "", "Film curve shoulder scale", 1.0, 0.0, 10.0),
  HDR_FILMCURVE_LINEAR_SCALE: value("HDR", "", "Film curve midtones scale", 1.0, 0.0, 10.0),
  HDR_FILMCURVE_TOE_SCALE: value("HDR", "", "Film curve toe scale", 1.0, 0.0, 10.0),
  HDR_FILMCURVE_WHITEPOINT: value("HDR", "", "Film curve whitepoint", 1.0, 0.0, 10.0),
  HDR_COLORGRADING_COLOR_SATURATION: value("HDR", "", "Saturation", 1.0, 0.0, 2.0),
  HDR_COLORGRADING_COLOR_BALANCE: color("HDR", "", "Color balance", vec3(1.0)),
  HDR_EYEADAPTATION_SCENEKEY: value("HDR", "(Dep) Scene key", "Scene key", 0.18, 0.0, 1.0),
  HDR_EYEADAPTATION_MIN_EXPOSURE: value("HDR", "(Dep) Min exposure", "Min exposure", 0.36, 0.0, 10.0),
  HDR_EYEADAPTATION_MAX_EXPOSURE: value("HDR", "(Dep) Max exposure", "Max exposure", 2.8, 0.0, 10.0),
  HDR_EYEADAPTATION_EV_MIN: value("HDR", "", "EV Min", 4.5, -10.0, 20.0),
  HDR_EYEADAPTATION_EV_MAX: value("HDR", "", "EV Max", 17.0, -10.0, 20.0),
  HDR_EYEADAPTATION_EV_AUTO_COMPENSATION: value("HDR", "", "EV Auto compensation", 1.5, -5.0, 5.0),
  HDR_BLOOM_AMOUNT: value("HDR", "", "Bloom amount", 0.1, 0.0, 10.0),

  CLOUDSHADING_SUNLIGHT_MULTIPLIER: value("Cloud Shading", "Sun contribution", "Cloud shading: Sun light multiplier", 1.96, 0.0, 16.0),
  CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR: color("Cloud Shading", "Sun custom color", "Cloud shading: Sun custom color", Color.fromBytes(215, 200.0, 170.0, 255).toVec3()),
  CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR_MULTIPLIER: value("Cloud Shading", "Sun custom color multiplier", "Cloud shading: Sun custom color multiplier", 1.0, 0.0, 16.0),
  CLOUDSHADING_SUNLIGHT_CUSTOM_COLOR_INFLUENCE: value("Cloud Shading", "Sun custom color influence", "Cloud shading: Sun custom color influence", 0.0,  0.0, 1.0),

  SUN_SHAFTS_VISIBILITY: value("Sun Rays Effect", "", "Sun shafts visibility", 0.25, 0.0, 1.0),
  SUN_RAYS_VISIBILITY: value("Sun Rays Effect", "", "Sun rays visibility", 1.0, 0.0, 10.0),
  SUN_RAYS_ATTENUATION: value("Sun Rays Effect", "", "Sun rays attenuation", 5.0, 0.0, 10.0),
  SUN_RAYS_SUNCOLORINFLUENCE: value("Sun Rays Effect", "", "Sun rays suncolor influence", 1.0, 0.0, 1.0),
  SUN_RAYS_CUSTOMCOLOR: color("Sun Rays Effect", "", "Sun rays custom color", vec3(1.0)),


  COLORGRADING_FILTERS_GRAIN: value("Filters", "Grain", "Filters: grain", 0.0, 0.0, 8.0),
  COLORGRADING_FILTERS_PHOTOFILTER_COLOR: color("Filters", "Photofilter color", "Filters: photofilter color", vec3([0.952, 0.517, 0.09])),
  COLORGRADING_FILTERS_PHOTOFILTER_DENSITY: value("Filters", "Photofilter density", "Filters: photofilter density", 0.0, 0.0, 1.0),

  COLORGRADING_DOF_FOCUSRANGE: value("Depth Of Field", "Focus range", "Dof: focus range", 1000.0, 0.0, 10000.0),
  COLORGRADING_DOF_BLURAMOUNT: value("Depth Of Field", "Blur amount", "Dof: blur amount", 0.0, 0.0, 1.0),

  OCEANFOG_COLOR: color("Advanced", "", "Ocean fog color", Color.fromBytes(29.0, 102.0, 141.0, 255).toVec3()),
  OCEANFOG_COLOR_MULTIPLIER: value("Advanced", "", "Ocean fog color multiplier", 1.0, 0.0, 1.0),
  OCEANFOG_DENSITY: value("Advanced", "", "Ocean fog density", 0.2, 0.0, 1.0),

  SKYBOX_MULTIPLIER: value("Advanced", "", "Static skybox multiplier", 1.0, 0.0, 1.0),

  // const float arrDepthConstBias[] = {1.0f, 1.0f, 1.9f, 3.0f, 2.0f, 2.0f, 2.0f, 2.0f};
  // const float arrDepthSlopeBias[] = {4.0f, 2.0f, 0.24f, 0.24f, 0.5f, 0.5f, 0.5f, 0.5f};
  // AddVar("Shadows", "", "Cascade 0: Bias", ITimeOfDay::PARAM_SHADOWSC0_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthConstBias[0], 0.0f, 10.0f);
  // AddVar("Shadows", "", "Cascade 0: Slope Bias", ITimeOfDay::PARAM_SHADOWSC0_SLOPE_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthSlopeBias[0], 0.0f, 500.0f);
  // AddVar("Shadows", "", "Cascade 1: Bias", ITimeOfDay::PARAM_SHADOWSC1_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthConstBias[1], 0.0f, 10.0f);
  // AddVar("Shadows", "", "Cascade 1: Slope Bias", ITimeOfDay::PARAM_SHADOWSC1_SLOPE_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthSlopeBias[1], 0.0f, 500.0f);
  // AddVar("Shadows", "", "Cascade 2: Bias", ITimeOfDay::PARAM_SHADOWSC2_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthConstBias[2], 0.0f, 10.0f);
  // AddVar("Shadows", "", "Cascade 2: Slope Bias", ITimeOfDay::PARAM_SHADOWSC2_SLOPE_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthSlopeBias[2], 0.0f, 500.0f);
  // AddVar("Shadows", "", "Cascade 3: Bias", ITimeOfDay::PARAM_SHADOWSC3_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthConstBias[3], 0.0f, 10.0f);
  // AddVar("Shadows", "", "Cascade 3: Slope Bias", ITimeOfDay::PARAM_SHADOWSC3_SLOPE_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthSlopeBias[3], 0.0f, 500.0f);
  // AddVar("Shadows", "", "Cascade 4: Bias", ITimeOfDay::PARAM_SHADOWSC4_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthConstBias[4], 0.0f, 10.0f);
  // AddVar("Shadows", "", "Cascade 4: Slope Bias", ITimeOfDay::PARAM_SHADOWSC4_SLOPE_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthSlopeBias[4], 0.0f, 500.0f);
  // AddVar("Shadows", "", "Cascade 5: Bias", ITimeOfDay::PARAM_SHADOWSC5_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthConstBias[5], 0.0f, 10.0f);
  // AddVar("Shadows", "", "Cascade 5: Slope Bias", ITimeOfDay::PARAM_SHADOWSC5_SLOPE_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthSlopeBias[5], 0.0f, 500.0f);
  // AddVar("Shadows", "", "Cascade 6: Bias", ITimeOfDay::PARAM_SHADOWSC6_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthConstBias[6], 0.0f, 10.0f);
  // AddVar("Shadows", "", "Cascade 6: Slope Bias", ITimeOfDay::PARAM_SHADOWSC6_SLOPE_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthSlopeBias[6], 0.0f, 500.0f);
  // AddVar("Shadows", "", "Cascade 7: Bias", ITimeOfDay::PARAM_SHADOWSC7_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthConstBias[7], 0.0f, 10.0f);
  // AddVar("Shadows", "", "Cascade 7: Slope Bias", ITimeOfDay::PARAM_SHADOWSC7_SLOPE_BIAS, ITimeOfDay::TYPE_FLOAT, arrDepthSlopeBias[7], 0.0f, 500.0f);

  // AddVar("Shadows", "", "Shadow jittering", ITimeOfDay::PARAM_SHADOW_JITTERING, ITimeOfDay::TYPE_FLOAT, 2.5f, 0.f, 10.f);

  HDR_DYNAMIC_POWER_FACTOR: value("Obsolete", "", "HDR dynamic power factor", 0.0, -4.0, 4.0),
  TERRAIN_OCCL_MULTIPLIER: value("Obsolete", "", "Sky brightening (terrain occlusion)", 0.3, 0., 1.),
  SUN_COLOR_MULTIPLIER: value("Obsolete", "", "Sun color multiplier", 1.0, 0.0, 16.0),
}

export function getTodParamByName(name: string): TodParam<IVec3 | number> | undefined {
  for (const key in TodParams) {
    const param = TodParams[key as keyof typeof TodParams]
    if (param.name === name) {
      return param
    }
  }
  return undefined
}

export type TodSpline = Array<TodSplineKey>

export type TodSplineKey = {
  time: number
  value: number[]
  flags: number
}

export function parseTodSpline(value: string): TodSpline | null {
  if (!value) {
    return null
  }
  const result: TodSpline = []

  // comma separated entries, ends with comma
  //  ENTRY,ENTRY,ENTRY,
  for (const entry of value.split(',')) {
    if (!entry) {
      continue
    }

    // colon separated entries
    //  TIME:VALUE:FLAGS
    // can't use split, since VALUE may contain colons
    const i1 = entry.indexOf(':')
    const i2 = entry.lastIndexOf(':')
    const time = entry.substring(0, i1)
    const value = entry.substring(i1 + 1, i2)
    const flags = entry.substring(i2 + 1)
    const key: TodSplineKey = {
      time: Number(time),
      flags: Number(flags),
      value: [],
    }

    // value is either a plain number or a vector
    // a vector always has parenthesis, e.g.: "(0.00699541:0.00972122:0.012983)"
    if (!value.startsWith('(')) {
      key.value = [Number(value)]
    } else {
      const [_, r, g, b] = value.split(/\(|:|\)/)
      key.value = [Number(r), Number(g), Number(b)]
    }
    result.push(key)
  }

  if (!result.length) {
    return null
  }
  return result
}
