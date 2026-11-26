import { describe, expect, it } from 'vitest'
import { mtlTextureFile, withNormalMapSmoothness } from './loader'
import { parseMtl } from './parse'

const MULTI = `<Material MtlFlags="524544" vertModifType="0">
 <SubMaterials>
  <Material Name="Stone" MtlFlags="524416" Shader="Illum" GenMask="80000001" StringGenMask="%ALLOW_SPECULAR_ANTIALIASING%DETAIL_MAPPING" SurfaceType="mat_stone" Diffuse="0.5,0.4,0.3" Specular="0.04,0.04,0.04" Opacity="1" AlphaTest="0" Emissive="" Shininess="255">
   <Textures>
    <Texture Map="Diffuse" File="Objects/Props/Textures/stone_diff.tif" AssetId="{11111111-2222-3333-4444-555555555555}"/>
    <Texture Map="Bumpmap" File="/objects/props/textures/stone_ddna.dds" Filter="7" IsTileU="0"/>
    <Texture Map="Detail" File="objects\\props\\textures\\detail.tif">
     <TexMod TexMod_RotateType="0" TexMod_TexGenType="0" TileU="4" TileV="4" OffsetU="0.5"/>
    </Texture>
    <Texture Map="Environment" File="$EnvironmentCube"/>
   </Textures>
   <PublicParams DetailDiffuseScale="0.5" BlendFactor="1" BlendLayer2Tint="1,0.5,0.25"/>
  </Material>
  <Material Name="Proxy" MtlFlags="1152" Shader="Illum" Opacity="0">
   <Textures/>
  </Material>
 </SubMaterials>
</Material>`

const SINGLE = `<?xml version="1.0"?>
<Material Name="water" Shader="WaterVolume" MtlFlags="18560">
 <Textures>
  <Texture Map="Bumpmap" File="materials/water/water_ddn.tif">
   <TexMod TexMod_RotateType="2" TexMod_UOscillatorType="2" TexMod_UOscillatorRate="0.1"/>
  </Texture>
 </Textures>
 <VertexDeform Type="2" DividerX="0.5" DividerY="0" NoiseScale="1,1,1">
  <WaveX Type="1" Amp="0.2" Level="0" Phase="0" Freq="1.5"/>
 </VertexDeform>
</Material>`

describe('parseMtl', () => {
  it('uses the sub materials as collection', () => {
    const doc = parseMtl(MULTI)
    expect(doc.materials.length).toBe(2)
    expect(doc.materials[0].attrs.Name).toBe('Stone')
    expect(doc.materials[1].attrs.Name).toBe('Proxy')
  })

  it('uses the root material if there are no sub materials', () => {
    const doc = parseMtl(SINGLE)
    expect(doc.materials.length).toBe(1)
    expect(doc.materials[0].attrs.Shader).toBe('WaterVolume')
  })

  it('reads attributes like nwbt', () => {
    const attrs = parseMtl(MULTI).materials[0].attrs
    expect(attrs).toEqual({
      Name: 'Stone',
      Shader: 'Illum',
      GenMask: '80000001',
      StringGenMask: '%ALLOW_SPECULAR_ANTIALIASING%DETAIL_MAPPING',
      MtlFlags: 524416,
      Diffuse: [0.5, 0.4, 0.3],
      Specular: [0.04, 0.04, 0.04],
      Opacity: 1,
      AlphaTest: 0,
      Shininess: 255,
      // empty lists are omitted, unknown attributes (SurfaceType) are ignored
    })
    expect(parseMtl(MULTI).materials[1].attrs.Opacity).toBe(0)
  })

  it('keeps public params as strings', () => {
    const params = parseMtl(MULTI).materials[0].params
    expect(params).toEqual({ DetailDiffuseScale: '0.5', BlendFactor: '1', BlendLayer2Tint: '1,0.5,0.25' })
    expect(parseMtl(MULTI).materials[1].params).toEqual({})
  })

  it('reads textures and texture modifiers', () => {
    const textures = parseMtl(MULTI).materials[0].textures
    expect(textures.length).toBe(4)
    expect(textures[0]).toEqual({
      Map: 'Diffuse',
      File: 'Objects/Props/Textures/stone_diff.tif',
      AssetId: '{11111111-2222-3333-4444-555555555555}',
    })
    expect(textures[1]).toEqual({
      Map: 'Bumpmap',
      File: '/objects/props/textures/stone_ddna.dds',
      Filter: 7,
      IsTileU: 0,
    })
    // zero rotate and tex gen types are omitted
    expect(textures[2].TexMod).toEqual({ TileU: 4, TileV: 4, OffsetU: 0.5 })
    expect(parseMtl(SINGLE).materials[0].textures[0].TexMod).toEqual({
      TexMod_RotateType: 2,
      TexMod_UOscillatorType: 2,
      TexMod_UOscillatorRate: 0.1,
    })
  })

  it('reads vertex deform', () => {
    expect(parseMtl(SINGLE).materials[0].vertexDeform).toEqual({
      Type: 2,
      DividerX: 0.5,
      NoiseScale: [1, 1, 1],
      WaveX: { Type: 1, Amp: 0.2, Level: 0, Phase: 0, Freq: 1.5 },
    })
    expect(parseMtl(MULTI).materials[0].vertexDeform).toBeUndefined()
  })

  it('rejects invalid documents', () => {
    expect(() => parseMtl('<Material')).toThrow()
    expect(() => parseMtl('<Foo/>')).toThrow()
  })
})

describe('withNormalMapSmoothness', () => {
  const ddna = { Map: 'Bumpmap', File: 'objects/props/textures/stone_ddna.tif', AssetId: '{a}' } as const

  it('adds the smoothness of a _ddna normal map the material does not name', () => {
    const result = withNormalMapSmoothness([{ Map: 'Diffuse', File: 'stone_diff.tif' }, ddna])
    expect(result).toHaveLength(3)
    expect(result[2]).toEqual({ Map: 'Smoothness', File: ddna.File, AssetId: ddna.AssetId })
  })

  it('replaces another smoothness texture and keeps the settings of the slot', () => {
    const named = { Map: 'Smoothness', File: 'other_ddna.tif', TexMod: { TileU: 2 } } as any
    const result = withNormalMapSmoothness([ddna, named])
    expect(result).toEqual([ddna, { Map: 'Smoothness', File: ddna.File, AssetId: ddna.AssetId, TexMod: { TileU: 2 } }])
  })

  it('takes the blend layer normal map for the second smoothness', () => {
    const result = withNormalMapSmoothness([{ Map: '[1] Custom', File: 'layer_ddna.tif' }])
    expect(result[1]).toMatchObject({ Map: 'SecondSmoothness', File: 'layer_ddna.tif' })
  })

  it('keeps the slots of normal maps without an attached alpha', () => {
    const textures = [{ Map: 'Bumpmap', File: 'stone_normal.tif' }] as const
    expect(withNormalMapSmoothness(textures)).toEqual(textures)
    expect(withNormalMapSmoothness([{ Map: 'Bumpmap', File: '$EngineNormal' }])).toHaveLength(1)
  })
})

describe('mtlTextureFile', () => {
  it('resolves the compiled dds file', () => {
    const textures = parseMtl(MULTI).materials[0].textures
    expect(mtlTextureFile(textures[0])).toBe('objects/props/textures/stone_diff.dds')
    expect(mtlTextureFile(textures[1])).toBe('objects/props/textures/stone_ddna.dds')
    expect(mtlTextureFile(textures[2])).toBe('objects/props/textures/detail.dds')
  })

  it('skips engine textures and empty references', () => {
    const textures = parseMtl(MULTI).materials[0].textures
    expect(mtlTextureFile(textures[3])).toBeNull()
    expect(mtlTextureFile({ Map: 'Diffuse' })).toBeNull()
  })

  it('skips the engine bound nearest cubemap', () => {
    expect(mtlTextureFile({ Map: 'Environment', File: 'nearest_cubemap', TexType: 7 })).toBeNull()
    expect(mtlTextureFile({ Map: 'Environment', File: 'nearest_cubemap' })).toBeNull()
  })

  it('rejects absolute paths of the authoring machine', () => {
    expect(mtlTextureFile({ Map: 'Diffuse', File: 'C:/users/artist/desktop/temp/wood_diff.tif' })).toBeNull()
    expect(mtlTextureFile({ Map: 'Diffuse', File: 'file:///c:/temp/wood_diff.tif' })).toBeNull()
  })

  it('appends the extension if missing', () => {
    expect(mtlTextureFile({ Map: 'Diffuse', File: 'textures/foo' })).toBe('textures/foo.dds')
  })
})
