import { describe, expect, it } from 'vitest'
import { isParticleEffectImmortal, resolveParticleEffect } from './effect'
import { parseCurve, parseParticleLibrary, parseTypeInfo, parseVec3, splitTopLevel } from './parse'
import { parseColorParam, parseVarParam, parseVec3VarParam } from './params'

const LIBRARY = `<ParticleLibrary Name="Buildables" Filename="libs/particles/buildables.xml" SandboxVersion="0.0.0.0" ParticleVersion="33">
  <Folder Name="Global">
    <Params/>
  </Folder>
  <Particles Name="Global.Candle_Flame_01">
    <Params Count="4" EmitterSizeDiameter="5" Continuous="true" ParticleLifeTime="0.6,Random=0.25" Facing="CameraX" Curvature="0" BlendType="Additive" Texture="textures/vfx/fire/fire_l_candle001_2x2.tif" TextureTiling="TilesX=2,TilesY=2,AnimFramesCount=4,AnimBlend=true" Alpha="0.25,ParticleAge=(v=1;t=0.68,v=1;t=1)" Color="ParticleAge=(t=0.16,v=(x=0.1,y=0.7,z=0.898);t=0.31,v=(x=0.83,y=0.65,z=0.263))" EmissiveLighting="5" MaintainAspectRatio="false" SizeX="0.01,ParticleAge=(v=0.863,d=0.27450967,flags=32;t=1,v=1)" PivotY="0.8" MoveRelEmitter="Yes"/>
    <LODs>
      <LevelOfDetail>
        <LodParticle Distance="40" Active="1">
          <Particle Name="Candle_Flame_01Lod40">
            <Params Enabled="false" Count="2"/>
          </Particle>
        </LodParticle>
      </LevelOfDetail>
    </LODs>
    <Childs>
      <Particles Name="Glow">
        <Params Count="2" LocalSpawnPosRandomOffset="x=0.025,y=0.025,z=0.025" SpawnPosRandomOffset="x=0.025,y=0.025,z=0.025" Continuous="true" ParticleLifeTime="0.5" SoftParticle="true,Softness=0.5"/>
      </Particles>
      <Particles Name="Disabled">
        <Params Enabled="false" Count="2"/>
      </Particles>
    </Childs>
  </Particles>
  <Particles Name="Burst">
    <Params Count="10" ParticleLifeTime="1"/>
  </Particles>
</ParticleLibrary>`

describe('particles/parse', () => {
  it('splits at top level', () => {
    expect(splitTopLevel('a,b=(1,2),c')).toEqual(['a', 'b=(1,2)', 'c'])
    expect(splitTopLevel(';t=1,v=1;t=2', ';')).toEqual(['', 't=1,v=1', 't=2'])
  })

  it('parses type info', () => {
    expect(parseTypeInfo('1.5,Random=0.4,ParticleAge=(v=0.5;t=1,v=1)')).toEqual({
      base: '1.5',
      named: { Random: '0.4', ParticleAge: '(v=0.5;t=1,v=1)' },
    })
    expect(parseTypeInfo('ParticleAge=(v=1)')).toEqual({ base: null, named: { ParticleAge: '(v=1)' } })
  })

  it('parses vectors', () => {
    expect(parseVec3('y=-0.05,z=-0.125', [0, 0, 0])).toEqual([0, -0.05, -0.125])
    expect(parseVec3('(x=0.32,y=0.32,z=0.32)', [1, 1, 1])).toEqual([0.32, 0.32, 0.32])
    // members equal to the default are omitted
    expect(parseVec3('(x=0.03,z=0.13)', [1, 1, 1])).toEqual([0.03, 1, 0.13])
    expect(parseVec3(undefined, [1, 1, 1])).toEqual([1, 1, 1])
  })

  it('evaluates curves', () => {
    // empty first key is t=0,v=0
    const curve = parseCurve('(;t=0.5,v=1;t=1)', 1)
    expect(curve.keys.length).toBe(3)
    expect(curve.value(0)).toBe(0)
    expect(curve.value(0.5)).toBeCloseTo(1)
    expect(curve.value(1)).toBe(0)
    // flat tangents: smooth step
    expect(curve.value(0.25)).toBeCloseTo(0.5)
    // linear tangents (in 4, out 32)
    const linear = parseCurve('v=0,flags=32;t=1,v=1,flags=4', 1)
    expect(linear.value(0.25)).toBeCloseTo(0.25)
    // clamped before the first and after the last key
    const inner = parseCurve('t=0.2,v=0.5;t=0.8,v=1', 1)
    expect(inner.value(0)).toBeCloseTo(0.5)
    expect(inner.value(1)).toBeCloseTo(1)
  })

  it('evaluates color curves', () => {
    const curve = parseCurve('t=0,v=(x=1,y=0.5);t=1,v=(z=1)', 3)
    expect(curve.dimension).toBe(3)
    expect(curve.component(0, 0)).toBe(1)
    expect(curve.component(0, 1)).toBe(0.5)
    expect(curve.component(1, 2)).toBe(1)
  })

  it('parses var params', () => {
    const p = parseVarParam('1.65,Random=0.4,ParticleAge=(v=0.5,d=0.99,flags=32;t=1,v=1)', 1)
    expect(p.base).toBe(1.65)
    expect(p.random).toBe(0.4)
    expect(p.age.keys.length).toBe(2)
    expect(parseVarParam(undefined, 3).base).toBe(3)
    // base omitted, default kept
    expect(parseVarParam('Random=0.8', 0).base).toBe(0)
    const xyz = parseVec3VarParam('X=(0.25,Random=2),Z=1')
    expect(xyz[0].base).toBe(0.25)
    expect(xyz[0].random).toBe(2)
    expect(xyz[1].base).toBe(0)
    expect(xyz[2].base).toBe(1)
  })

  it('parses color params', () => {
    const c = parseColorParam(
      '(x=0.73,y=0.4,z=0.25),ParticleAge=(t=0.02,v=(x=1,y=1,z=1)),Color=(x=0.9,y=0.1,z=0.05)',
      [1, 1, 1],
    )
    expect(c.base).toEqual([0.73, 0.4, 0.25])
    expect(c.base2).toEqual([0.9, 0.1, 0.05])
    expect(c.age.dimension).toBe(3)
    expect(parseColorParam('(x=0.12,y=0.12,z=0.12),Random=0.25', [1, 1, 1]).random).toBe(0.25)
    // only the base color, x is the default 1
    expect(parseColorParam('(y=0.234551,z=0.074214)', [1, 1, 1]).base).toEqual([1, 0.234551, 0.074214])
  })

  it('parses a library', () => {
    const lib = parseParticleLibrary(LIBRARY)
    expect(lib.name).toBe('Buildables')
    expect(lib.version).toBe(33)
    expect(lib.effects.map((it) => it.name)).toEqual(['Global.Candle_Flame_01', 'Burst'])
  })

  it('resolves effects', () => {
    const lib = parseParticleLibrary(LIBRARY)
    const effect = resolveParticleEffect(lib, 'Buildables.Global.Candle_Flame_01')
    expect(effect.fullName).toBe('Buildables.Global.Candle_Flame_01')
    expect(effect.params.count.base).toBe(4)
    expect(effect.params.continuous).toBe(true)
    expect(effect.params.facing).toBe('CameraX')
    expect(effect.params.blendType).toBe('Additive')
    expect(effect.params.textureTiling).toMatchObject({ tilesX: 2, tilesY: 2, animFramesCount: 4, animBlend: true })
    expect(effect.params.maintainAspectRatio).toBe(false)
    expect(effect.params.moveRelEmitter).toBe(true)
    expect(effect.children.map((it) => it.name)).toEqual(['Glow', 'Disabled'])
    const glow = effect.children[0].params
    expect(glow.spawnPosRandomOffset).toEqual([0.025, 0.025, 0.025])
    expect(glow.softParticle).toBe(true)
    expect(glow.softness).toBe(0.5)
    expect(effect.children[1].params).toBeNull()
    expect(isParticleEffectImmortal(effect)).toBe(true)

    expect(resolveParticleEffect(lib, 'Buildables.Global.Candle_Flame_01.Glow').name).toBe('Glow')
    expect(resolveParticleEffect(lib, 'buildables.global.candle_flame_01')).not.toBeNull()
    expect(resolveParticleEffect(lib, 'Buildables.Missing')).toBeNull()
    expect(isParticleEffectImmortal(resolveParticleEffect(lib, 'Buildables.Burst'))).toBe(false)
  })
})
