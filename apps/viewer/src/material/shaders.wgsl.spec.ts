/// <reference types="@webgpu/types" />
import { beforeAll, describe, expect, it } from 'vitest'
import FX_MESH_ADVANCED_WGSL from './FxMeshAdvancedMaterial.wgsl'
import HUMAN_SKIN_WGSL from './HumanSkinMaterial.wgsl'
import FX_MESH_ADVANCED_TRANSP_WGSL from './FxMeshAdvancedTranspMaterial.wgsl'
import HAIR_WGSL from './HairMaterial.wgsl'
import ILLUM_WGSL from './IllumMaterial.wgsl'
import ILLUM_PROJECTED_DECAL_WGSL from './IllumProjectedDecal.wgsl'
import { TERRAIN_PATCH_SHADER } from './TerrainPatchMaterial.wgsl'
import VEGETATION_WGSL from './VegetationMaterial.wgsl'
import PARTICLE_WGSL from '../game/particles/ParticleMaterial.wgsl'
import DISTANCE_CLOUDS_WGSL from './DistanceCloudsMaterial.wgsl'
import GLTF_WGSL from './GltfMaterial.wgsl'
import { LIGHTING_WGSL } from '../graphics/passes/lighting/LightingPass.wgsl'
import { XE_GTAO_MAIN_WGSL } from '../graphics/passes/ssao/XeGtao.wgsl'
import { SMAA_BLEND_WGSL, SMAA_EDGES_WGSL, SMAA_WEIGHTS_WGSL } from '../graphics/passes/smaa/SmaaPass.wgsl'
import { CMAA2_WGSL } from '../graphics/passes/cmaa2/Cmaa2Pass.wgsl'
import { FILTER_GBUFFER_WGSL } from '../graphics/passes/gbuffer/FilterGBufferPass'
import { BLOOM_DOWNSAMPLE_WGSL, BLOOM_GAUSSIAN_WGSL } from '../graphics/passes/bloom/BloomPass.wgsl'
import { FILM_MAPPING_WGSL } from '../graphics/passes/filmmapping/FilmMappingPass.wgsl'

// compiles material shader sources on the GPU and checks the entry points the render variants use
const SHADERS: Array<{ name: string; source: string; fragmentEntries: string[] }> = [
  {
    name: 'Illum',
    source: ILLUM_WGSL,
    fragmentEntries: ['fs_main', 'fs_gbuffer', 'fs_gbuffer_decal', 'fs_emissive', 'fs_debug'],
  },
  // projected decal boxes with the Illum material block (plan 7.7)
  {
    name: 'IllumProjectedDecal',
    source: ILLUM_PROJECTED_DECAL_WGSL,
    fragmentEntries: ['fs_decal', 'fs_decal_emissive'],
  },
  // opaque only: no forward entry
  { name: 'TerrainPatch', source: TERRAIN_PATCH_SHADER, fragmentEntries: ['fs_gbuffer', 'fs_debug'] },
  { name: 'Vegetation', source: VEGETATION_WGSL, fragmentEntries: ['fs_gbuffer', 'fs_debug'] },
  {
    name: 'FxMeshAdvanced',
    source: FX_MESH_ADVANCED_WGSL,
    fragmentEntries: ['fs_main', 'fs_gbuffer', 'fs_emissive', 'fs_debug'],
  },
  // additive, forward only
  { name: 'FxMeshAdvancedTransp', source: FX_MESH_ADVANCED_TRANSP_WGSL, fragmentEntries: ['fs_main'] },
  { name: 'HumanSkin', source: HUMAN_SKIN_WGSL, fragmentEntries: ['fs_main', 'fs_gbuffer', 'fs_emissive', 'fs_debug'] },
  // forward opaque only (drawn after the lighting)
  { name: 'Hair', source: HAIR_WGSL, fragmentEntries: ['fs_main'] },
  // sky dome clouds (General / %SIMPLE / %ADVANCED by constants)
  { name: 'DistanceClouds', source: DISTANCE_CLOUDS_WGSL, fragmentEntries: ['fs_main'] },
  // sprite particles (game/particles)
  { name: 'Particle', source: PARTICLE_WGSL, fragmentEntries: ['fs_main'] },
  // glTF files (GltfMaterial)
  { name: 'Gltf', source: GLTF_WGSL, fragmentEntries: ['fs_main', 'fs_gbuffer', 'fs_emissive'] },
]

describe('material shaders', () => {
  let device: GPUDevice
  beforeAll(async () => {
    const adapter = await navigator.gpu.requestAdapter()
    device = await adapter!.requestDevice()
  })

  for (const shader of SHADERS) {
    it(`${shader.name} compiles`, async () => {
      const module = device.createShaderModule({ code: shader.source })
      const info = await module.getCompilationInfo()
      const errors = info.messages
        .filter((m) => m.type === 'error')
        .map((m) => `${m.lineNum}:${m.linePos} ${m.message}`)
      expect(errors).toEqual([])
    })

    for (const entry of shader.fragmentEntries) {
      it(`${shader.name} has fragment entry ${entry}`, () => {
        expect(shader.source).toMatch(new RegExp(`@fragment\\s+fn\\s+${entry}\\s*\\(`))
      })
    }
  }

  const PASS_SHADERS: Array<[string, string]> = [
    ['XeGTAO main', XE_GTAO_MAIN_WGSL],
    ['SMAA edges', SMAA_EDGES_WGSL],
    ['SMAA weights', SMAA_WEIGHTS_WGSL],
    ['SMAA blend', SMAA_BLEND_WGSL],
    ['CMAA2', CMAA2_WGSL],
    ['Filter GBuffer', FILTER_GBUFFER_WGSL],
    ['Bloom downsample', BLOOM_DOWNSAMPLE_WGSL],
    ['Bloom gaussian', BLOOM_GAUSSIAN_WGSL],
    ['Film mapping', FILM_MAPPING_WGSL],
  ]
  for (const [name, code] of PASS_SHADERS) {
    it(`${name} pass compiles`, async () => {
      const module = device.createShaderModule({ code })
      const info = await module.getCompilationInfo()
      const errors = info.messages
        .filter((m) => m.type === 'error')
        .map((m) => `${m.lineNum}:${m.linePos} ${m.message}`)
      expect(errors).toEqual([])
    })
  }

  // the deferred lighting reuses the material lighting chunks (COMMON_WGSL) in a compute shader,
  // the pipeline creation checks that no fragment only builtin is reachable from the compute entry point
  it('deferred lighting compute pipeline builds', async () => {
    device.pushErrorScope('validation')
    const module = device.createShaderModule({ code: LIGHTING_WGSL })
    device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } })
    const error = await device.popErrorScope()
    expect(error?.message ?? null).toBe(null)
  })
})
