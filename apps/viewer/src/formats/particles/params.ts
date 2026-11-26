import type { ParticleCurve } from './curve'
import { isVectorValue, parseBool, parseCurve, parseNumber, parseTypeInfo, parseVec3 } from './parse'

export type Vec3Tuple = [number, number, number]

/**
 * A variable parameter: base value, random variation, emitter strength curve and particle age curve.
 * Covers CryEngine `TVarParam`, `TVarEParam`, `TVarEPParam` and `TVarEPParamRandLerp`.
 *
 * @remarks
 * Value at emission: `base * (1 - random01 * random) * strength(emitterStrength)`, the age curve is applied over the particle life.
 * The random lerp variant interpolates with a secondary value and curves by a per particle random lerp factor.
 */
export interface VarParam {
  base: number
  random: number
  strength: ParticleCurve | null
  age: ParticleCurve | null
  /**
   * Secondary base value (RandLerp params only, `Color=` member)
   */
  base2: number
  strength2: ParticleCurve | null
  age2: ParticleCurve | null
  randomLerpColor: boolean
  randomLerpStrength: boolean
  randomLerpAge: boolean
}

export interface ColorParam {
  base: Vec3Tuple
  /**
   * Gray random variation, or random hue if {@link randomHue}
   */
  random: number
  randomHue: boolean
  strength: ParticleCurve | null
  age: ParticleCurve | null
  base2: Vec3Tuple
  strength2: ParticleCurve | null
  age2: ParticleCurve | null
  randomLerpColor: boolean
  randomLerpStrength: boolean
  randomLerpAge: boolean
}

export type Vec3VarParam = [VarParam, VarParam, VarParam]

export type EmitterShape = 'ANGLE' | 'POINT' | 'SPHERE' | 'CIRCLE' | 'BOX' | 'TRAIL' | 'BEAM'
export type ParticleFacing =
  | 'Camera'
  | 'CameraX'
  | 'Free'
  | 'Horizontal'
  | 'Velocity'
  | 'Water'
  | 'Terrain'
  | 'Decal'
  | 'Shape'
export type ParticleBlend = 'AlphaBased' | 'Additive' | 'Multiplicative' | 'Opaque'
export type SpawnIndirection = 'Direct' | 'ParentStart' | 'ParentCollide' | 'ParentDeath'
export type AnimCycle = 'Once' | 'Loop' | 'Mirror'

export interface TextureTiling {
  tilesX: number
  tilesY: number
  firstTile: number
  variantCount: number
  animFramesCount: number
  animCycle: AnimCycle
  animBlend: boolean
  horizontalFlipChance: number
  verticalFlipChance: number
  /**
   * Frames per second, 0 = one cycle per particle life
   */
  animFramerate: number
  animCurve: ParticleCurve | null
}

/**
 * The subset of CryEngine `ParticleParams` that the viewer uses, with engine defaults applied
 */
export interface ParticleParams {
  enabled: boolean
  isGpu: boolean
  emitterShape: EmitterShape
  spawnIndirection: SpawnIndirection
  group: boolean

  // Emitter
  count: VarParam
  continuous: boolean
  spawnDelay: VarParam
  emitterLifeTime: VarParam
  pulsePeriod: VarParam
  particleLifeTime: VarParam
  maintainDensity: number

  // Location
  spawnPosOffset: Vec3Tuple
  spawnPosRandomOffset: Vec3Tuple
  offsetRoundness: number
  spawnIncrement: VarParam

  // Angles
  focusAngle: VarParam
  focusAzimuth: VarParam
  focusCameraDir: VarParam
  focusGravityDir: boolean
  focusRotatesEmitter: boolean
  emitOffsetDir: boolean
  emitAngle: VarParam
  facing: ParticleFacing
  orientToVelocity: boolean
  curvature: number

  // Appearance
  blendType: ParticleBlend
  texture: string
  material: string
  geometry: string
  textureTiling: TextureTiling
  softParticle: boolean
  softness: number
  /**
   * CameraNonFacingFade: fades sprites that are not camera facing by the angle to the camera,
   * alpha *= curve(|dot(to camera, sprite normal)|)
   */
  cameraNonFacingFade: boolean
  cameraNonFacingFadeCurve: ParticleCurve | null
  alpha: VarParam
  color: ColorParam

  // Lighting
  diffuseLighting: number
  diffuseBacklighting: number
  emissiveLighting: number
  /**
   * How much the time of day particle brightness applies, `(brightness - 1) * influence + 1` (fTodBrightnessInfluence)
   */
  todBrightnessInfluence: number

  // Size
  sizeX: VarParam
  sizeY: VarParam
  sizeZ: VarParam
  maintainAspectRatio: boolean
  pivotX: VarParam
  pivotY: VarParam
  stretch: VarParam
  stretchOffsetRatio: number
  tailLength: VarParam
  thickness: number

  // Shape params
  emitterSizeDiameter: VarParam
  emitterSizeXYZ: Vec3VarParam
  spawnOffset: VarParam
  spawnPosXYZ: Vec3VarParam
  spawnPosXYZRandom: Vec3VarParam
  spawnPosIncrementXYZ: Vec3VarParam
  spawnPosIncrementXYZRandom: Vec3VarParam
  velocity: Vec3VarParam
  velocityXYZRandom: Vec3VarParam
  velocitySpread: VarParam

  // Movement
  speed: VarParam
  inheritVelocity: number
  airResistance: VarParam
  rotationalDragScale: number
  windScale: number
  gravityScale: VarParam
  acceleration: Vec3Tuple
  turbulence3DSpeed: VarParam
  turbulenceSize: VarParam
  turbulenceSpeed: VarParam
  moveRelEmitter: boolean

  // Rotation
  initAngles: Vec3Tuple
  randomAngles: Vec3Tuple
  rotationRateX: VarParam
  rotationRateY: VarParam
  rotationRateZ: VarParam

  // Visibility
  cameraMaxDistance: number
  cameraMinDistance: number
  cameraDistanceOffset: number
  sortOffset: number
}

/**
 * Inherited data of `Group` parents, see `ParticleParams::InheritedGroupParams` and `UpdateGroupValues`
 */
export interface ParticleGroupData {
  positionOffset: Vec3Tuple
  randomOffset: Vec3Tuple
  offsetRoundness: number
  offsetInnerFraction: number
  initAngles: Vec3Tuple
  randomAngles: Vec3Tuple
  stretch: number
}

export function emptyGroupData(): ParticleGroupData {
  return {
    positionOffset: [0, 0, 0],
    randomOffset: [0, 0, 0],
    offsetRoundness: 0,
    offsetInnerFraction: 0,
    initAngles: [0, 0, 0],
    randomAngles: [0, 0, 0],
    stretch: 0,
  }
}

export function varParam(base: number): VarParam {
  return {
    base,
    random: 0,
    strength: null,
    age: null,
    base2: 0,
    strength2: null,
    age2: null,
    randomLerpColor: false,
    randomLerpStrength: false,
    randomLerpAge: false,
  }
}

/**
 * Parses a variable parameter, e.g. `1.5,Random=0.4,ParticleAge=(v=0.5;t=1,v=1)`
 */
export function parseVarParam(value: string | null | undefined, fallback: number): VarParam {
  const result = varParam(fallback)
  if (value == null) {
    return result
  }
  const info = parseTypeInfo(value)
  result.base = parseNumber(info.base, fallback)
  result.random = parseNumber(info.named.Random, 0)
  result.strength = parseCurve(info.named.EmitterStrength, 1)
  result.age = parseCurve(info.named.ParticleAge, 1)
  result.base2 = parseNumber(info.named.Color, 0)
  result.strength2 = parseCurve(info.named.EmitterStrength2, 1)
  result.age2 = parseCurve(info.named.ParticleAge2, 1)
  result.randomLerpColor = parseBool(info.named.RandomLerpColor, false)
  result.randomLerpStrength = parseBool(info.named.RandomLerpStrength, false)
  result.randomLerpAge = parseBool(info.named.RandomLerpAge, false)
  return result
}

export function parseColorParam(value: string | null | undefined, fallback: Vec3Tuple): ColorParam {
  const result: ColorParam = {
    base: [...fallback],
    random: 0,
    randomHue: false,
    strength: null,
    age: null,
    base2: [0, 0, 0],
    strength2: null,
    age2: null,
    randomLerpColor: false,
    randomLerpStrength: false,
    randomLerpAge: false,
  }
  if (value == null) {
    return result
  }
  // only the base color, e.g. `(y=0.23,z=0.07)`
  if (isVectorValue(value)) {
    result.base = parseVec3(value, fallback)
    return result
  }
  const info = parseTypeInfo(value)
  if (info.base != null) {
    result.base = parseVec3(info.base, fallback)
  }
  if (info.named.Random != null) {
    const random = parseTypeInfo(info.named.Random)
    result.random = parseNumber(random.base, 0)
    result.randomHue = parseBool(random.named.RandomHue, false)
  }
  result.strength = parseCurve(info.named.EmitterStrength, 3)
  result.age = parseCurve(info.named.ParticleAge, 3)
  if (info.named.Color != null) {
    result.base2 = parseVec3(info.named.Color, [0, 0, 0])
  }
  result.strength2 = parseCurve(info.named.EmitterStrength2, 3)
  result.age2 = parseCurve(info.named.ParticleAge2, 3)
  result.randomLerpColor = parseBool(info.named.RandomLerpColor, false)
  result.randomLerpStrength = parseBool(info.named.RandomLerpStrength, false)
  result.randomLerpAge = parseBool(info.named.RandomLerpAge, false)
  return result
}

/**
 * Parses a vector of variable parameters, e.g. `X=(1,Random=2),Y=3`
 */
export function parseVec3VarParam(value: string | null | undefined, fallback = 0): Vec3VarParam {
  const info = parseTypeInfo(value)
  return [
    parseVarParam(info.named.X, fallback),
    parseVarParam(info.named.Y, fallback),
    parseVarParam(info.named.Z, fallback),
  ]
}

function parseEnum<T extends string>(value: string | null | undefined, options: readonly T[], fallback: T): T {
  if (!value) {
    return fallback
  }
  const found = options.find((it) => it.toLowerCase() === value.toLowerCase())
  return found ?? fallback
}

const SHAPES: EmitterShape[] = ['ANGLE', 'POINT', 'SPHERE', 'CIRCLE', 'BOX', 'TRAIL', 'BEAM']
const FACINGS: ParticleFacing[] = [
  'Camera',
  'CameraX',
  'Free',
  'Horizontal',
  'Velocity',
  'Water',
  'Terrain',
  'Decal',
  'Shape',
]
const BLENDS: ParticleBlend[] = ['AlphaBased', 'Additive', 'Multiplicative', 'Opaque']
const SPAWNS: SpawnIndirection[] = ['Direct', 'ParentStart', 'ParentCollide', 'ParentDeath']
const CYCLES: AnimCycle[] = ['Once', 'Loop', 'Mirror']

function parseTiling(value: string | null | undefined): TextureTiling {
  const info = parseTypeInfo(value)
  const n = info.named
  const result: TextureTiling = {
    tilesX: Math.max(1, parseNumber(n.TilesX, 1)),
    tilesY: Math.max(1, parseNumber(n.TilesY, 1)),
    firstTile: parseNumber(n.FirstTile, 0),
    variantCount: Math.max(1, parseNumber(n.VariantCount, 1)),
    animFramesCount: Math.max(1, parseNumber(n.AnimFramesCount, 1)),
    animCycle: parseEnum(n.AnimCycle, CYCLES, 'Once'),
    animBlend: parseBool(n.AnimBlend, false),
    horizontalFlipChance: parseNumber(n.HorizontalFlipChance, 0),
    verticalFlipChance: parseNumber(n.VerticalFlipChance, 0),
    animFramerate: parseNumber(n.AnimFramerate, 0),
    animCurve: parseCurve(n.AnimCurve, 1),
  }
  // STextureTiling::Correct
  const tileCount = result.tilesX * result.tilesY
  result.firstTile = Math.min(result.firstTile, tileCount - 1)
  result.animFramesCount = Math.min(result.animFramesCount, tileCount - result.firstTile)
  result.variantCount = Math.max(
    1,
    Math.min(result.variantCount, Math.floor((tileCount - result.firstTile) / result.animFramesCount)),
  )
  return result
}

/**
 * Reads the params of an effect node with engine defaults.
 *
 * @param attrs - the xml attributes of `<Params>`
 * @param group - inherited data of `Group` parents
 */
export function readParticleParams(attrs: Record<string, string>, group: ParticleGroupData): ParticleParams {
  const a = attrs
  const isGpu = a.EmitterType === 'GPU'
  const shape = isGpu ? parseEnum(a.EmitterGpuShape, SHAPES, 'ANGLE') : parseEnum(a.EmitterShape, SHAPES, 'ANGLE')
  const isGroup = parseBool(a.Group, false)
  const soft = parseTypeInfo(a.SoftParticle)
  const nonFacingFade = parseTypeInfo(a.CameraNonFacingFade)
  const air = parseTypeInfo(a.AirResistance)
  const stretch = parseTypeInfo(a.LocalStretch ?? a.Stretch)

  // CalculateFinalGroupValues: the local values plus the inherited group values
  const localOffset = parseVec3(a.LocalSpawnPosOffset ?? a.SpawnPosOffset, [0, 0, 0])
  const localRandomOffset = parseVec3(a.LocalSpawnPosRandomOffset ?? a.SpawnPosRandomOffset, [0, 0, 0])
  const localInitAngles = parseVec3(a.LocalInitAngles ?? a.InitAngles, [0, 0, 0])
  const localRandomAngles = parseVec3(a.LocalRandomAngles ?? a.RandomAngles, [0, 0, 0])
  const spawnIncrement = parseVarParam(a.LocalSpawnIncrement ?? a.SpawnIncrement, 0)
  spawnIncrement.base += group.offsetInnerFraction
  const stretchParam = parseVarParam(a.LocalStretch ?? a.Stretch, 0)
  stretchParam.base += group.stretch

  const params: ParticleParams = {
    enabled: parseBool(a.Enabled, true),
    isGpu,
    emitterShape: shape,
    spawnIndirection: parseEnum(a.SpawnIndirection, SPAWNS, 'Direct'),
    group: isGroup,

    count: parseVarParam(shape === 'BEAM' ? a.BeamCount : a.Count, 0),
    continuous: parseBool(a.Continuous, false),
    spawnDelay: parseVarParam(a.SpawnDelay, 0),
    emitterLifeTime: parseVarParam(a.EmitterLifeTime, 0),
    pulsePeriod: parseVarParam(a.PulsePeriod, 0),
    particleLifeTime: parseVarParam(shape === 'BEAM' ? a.BeamAge : a.ParticleLifeTime, shape === 'BEAM' ? 2 : 0),
    maintainDensity: parseNumber(parseTypeInfo(a.MaintainDensity).base, 0),

    spawnPosOffset: add(localOffset, group.positionOffset),
    spawnPosRandomOffset: add(localRandomOffset, group.randomOffset),
    offsetRoundness: parseNumber(a.LocalOffsetRoundness ?? a.OffsetRoundness, 0) + group.offsetRoundness,
    spawnIncrement,

    focusAngle: parseVarParam(a.FocusAngle, 0),
    focusAzimuth: parseVarParam(a.FocusAzimuth, 0),
    focusCameraDir: parseVarParam(a.FocusCameraDir, 0),
    focusGravityDir: parseBool(a.FocusGravityDir, false),
    focusRotatesEmitter: parseBool(a.FocusRotatesEmitter, false),
    emitOffsetDir: parseBool(a.EmitOffsetDir, false),
    emitAngle: parseVarParam(a.EmitAngle, 0),
    facing: parseEnum(a.Facing, FACINGS, 'Camera'),
    orientToVelocity: parseBool(a.OrientToVelocity, false),
    curvature: parseNumber(a.Curvature, 1),

    blendType: parseEnum(a.BlendType, BLENDS, 'AlphaBased'),
    texture: a.Texture || '',
    material: a.Material || '',
    geometry: a.Geometry || '',
    textureTiling: parseTiling(a.TextureTiling),
    softParticle: parseBool(soft.base, false),
    softness: parseNumber(soft.named.Softness, 1),
    cameraNonFacingFade: parseBool(nonFacingFade.base, false),
    cameraNonFacingFadeCurve: parseCurve(nonFacingFade.named.FadeCurve, 1),
    alpha: parseVarParam(a.Alpha, 1),
    color: parseColorParam(a.Color, [1, 1, 1]),

    diffuseLighting: parseNumber(a.DiffuseLighting, 1),
    diffuseBacklighting: parseNumber(a.DiffuseBacklighting, 0),
    emissiveLighting: parseNumber(a.EmissiveLighting, 0),
    todBrightnessInfluence: parseNumber(a.TodBrightnessInfluence, 1),

    sizeX: parseVarParam(a.SizeX, 1),
    sizeY: parseVarParam(a.SizeY, 1),
    sizeZ: parseVarParam(a.SizeZ, 1),
    maintainAspectRatio: parseBool(a.MaintainAspectRatio, true),
    pivotX: parseVarParam(a.PivotX, 0),
    pivotY: parseVarParam(a.PivotY, 0),
    stretch: stretchParam,
    stretchOffsetRatio: parseNumber(stretch.named.OffsetRatio, 0),
    tailLength: parseVarParam(a.TailLength, 0),
    thickness: parseNumber(a.Thickness, 1),

    emitterSizeDiameter: parseVarParam(a.EmitterSizeDiameter, 0),
    emitterSizeXYZ: parseVec3VarParam(a.EmitterSizeXYZ),
    spawnOffset: parseVarParam(a.SpawnOffset, 0),
    spawnPosXYZ: parseVec3VarParam(a.SpawnPosXYZ),
    spawnPosXYZRandom: parseVec3VarParam(a.SpawnPosXYZRandom),
    spawnPosIncrementXYZ: parseVec3VarParam(a.SpawnPosIncrementXYZ),
    spawnPosIncrementXYZRandom: parseVec3VarParam(a.SpawnPosIncrementXYZRandom),
    velocity: parseVec3VarParam(a.Velocity),
    velocityXYZRandom: parseVec3VarParam(a.VelocityXYZRandom),
    velocitySpread: parseVarParam(a.VelocitySpread, 360),

    speed: parseVarParam(a.Speed, 0),
    inheritVelocity: parseNumber(a.InheritVelocity, 0),
    airResistance: parseVarParam(a.AirResistance, 0),
    rotationalDragScale: parseNumber(air.named.RotationalDragScale, 1),
    windScale: parseNumber(air.named.WindScale, 1),
    gravityScale: parseVarParam(a.GravityScale, 0),
    acceleration: parseVec3(a.Acceleration, [0, 0, 0]),
    turbulence3DSpeed: parseVarParam(a.Turbulence3DSpeed, 0),
    turbulenceSize: parseVarParam(a.TurbulenceSize, 0),
    turbulenceSpeed: parseVarParam(a.TurbulenceSpeed, 0),
    // NW has 'Dynamic' in addition to Yes and YesWithTail
    moveRelEmitter: !!a.MoveRelEmitter && a.MoveRelEmitter !== 'No',

    initAngles: add(localInitAngles, group.initAngles),
    randomAngles: add(localRandomAngles, group.randomAngles),
    rotationRateX: parseVarParam(a.RotationRateX, 0),
    rotationRateY: parseVarParam(a.RotationRateY, 0),
    rotationRateZ: parseVarParam(a.RotationRateZ, 0),

    cameraMaxDistance: parseNumber(a.CameraMaxDistance, 0),
    cameraMinDistance: parseNumber(a.CameraMinDistance, 0),
    cameraDistanceOffset: parseNumber(a.CameraDistanceOffset, 0),
    sortOffset: parseNumber(a.SortOffset, 0),
  }

  if (isGroup) {
    // no spawning particles for group items
    params.count = varParam(0)
    params.continuous = false
  }
  return params
}

/**
 * The group data a child inherits from its parent, see `UpdateGroupValues`
 */
export function childGroupData(attrs: Record<string, string> | null, inherited: ParticleGroupData): ParticleGroupData {
  if (!attrs || !parseBool(attrs.Group, false)) {
    return inherited
  }
  return {
    positionOffset: add(parseVec3(attrs.LocalSpawnPosOffset, [0, 0, 0]), inherited.positionOffset),
    randomOffset: add(parseVec3(attrs.LocalSpawnPosRandomOffset, [0, 0, 0]), inherited.randomOffset),
    offsetRoundness: parseNumber(attrs.LocalOffsetRoundness, 0) + inherited.offsetRoundness,
    offsetInnerFraction: parseVarParam(attrs.LocalSpawnIncrement, 0).base + inherited.offsetInnerFraction,
    initAngles: add(parseVec3(attrs.LocalInitAngles, [0, 0, 0]), inherited.initAngles),
    randomAngles: add(parseVec3(attrs.LocalRandomAngles, [0, 0, 0]), inherited.randomAngles),
    stretch: parseVarParam(attrs.LocalStretch, 0).base + inherited.stretch,
  }
}

function add(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

/**
 * Whether the effect runs forever: continuous without emitter lifetime, pulsing, or particles without lifetime.
 * See `ParticleParams::IsImmortal`
 */
export function isImmortal(p: ParticleParams): boolean {
  return (
    p.enabled &&
    ((p.continuous && !p.emitterLifeTime.base && !!p.count.base) || !!p.pulsePeriod.base || !p.particleLifeTime.base)
  )
}
