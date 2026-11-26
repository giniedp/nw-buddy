import { Texture, type MaterialOptions } from '@gglib/graphics'
import { DistanceCloudsMaterial } from './DistanceCloudsMaterial'
import { FxMeshAdvancedMaterial } from './FxMeshAdvancedMaterial'
import { FxMeshAdvancedTranspMaterial } from './FxMeshAdvancedTranspMaterial'
import { GeometryBeamMaterial } from './GeometryBeamMaterial'
import { GeometryBeamSimpleMaterial } from './GeometryBeamSimpleMaterial'
import { GeometryFogMaterial } from './GeometryfogMaterial'
import { GlassMaterial } from './GlassMaterial'
import { HairMaterial } from './HairMaterial'
import { HumanSkinMaterial } from './HumanSkinMaterial'
import { IllumMaterial } from './IllumMaterial'
import { MeshparticleMaterial } from './MeshparticleMaterial'
import { NowDrawMaterial } from './NoDrawMaterial'
import { ParticleImposterMaterial } from './ParticleImposterMaterial'
import { TerrainCompositeMaterial } from './TerrainCompositeMaterial'
import { UnknownMaterial } from './UnknownMaterial'
import { VegetationMaterial } from './VegetationMaterial'
import { WaterPatchMaterial } from './WaterPatchMaterial'
import { WaterVolumeMaterial } from './WaterVolumeMaterial'

/**
 * Returns the factory of the material class that implements the given New World shader
 *
 * @remarks
 * Used by all material sources (glTF `EXT_nw_material` and `.mtl` files), so they create the same material classes.
 *
 * @param shader - the `Shader` attribute of the material, e.g. `Illum`
 * @param stringGenMask - only used to log unknown shaders
 */
export function nwMaterialFactory(shader: string, stringGenMask?: string): MaterialOptions['factory'] {
  const factory = shaderMaterialFactory(shader, stringGenMask)
  return (device, options) => {
    const material = factory(device, options)
    // the textures were loaded for this material (see the mtl loader). Assigned maps are owned through setInput,
    // this also covers maps the shader does not use, they would stay in the global scope otherwise
    const textures = (options?.properties as { textures?: Record<string, unknown> })?.textures
    for (const key in textures || {}) {
      const texture = textures[key]
      if (texture instanceof Texture) {
        material.ownership.adopt(texture)
      }
    }
    return material
  }
}

function shaderMaterialFactory(shader: string, stringGenMask?: string): MaterialOptions['factory'] {
  switch (shader?.toLocaleLowerCase()) {
    case 'terraintilecomposite':
      return (device, asset) => new TerrainCompositeMaterial(device, asset)
    case 'illum':
    // illum_oceansplash.cfx is an older fork of illum.cfx (fewer features, no SSS cutoff), Illum covers it
    case 'illum_oceansplash':
      return (device, asset) => new IllumMaterial(device, asset)
    case 'glass':
      return (device, asset) => new GlassMaterial(device, asset)
    case 'humanskin':
      return (device, asset) => new HumanSkinMaterial(device, asset)
    case 'hair':
      return (device, asset) => new HairMaterial(device, asset)
    case 'nodraw':
      return (device) => new NowDrawMaterial(device)
    // The game draws Silhouette materials, here they draw nothing.
    case 'silhouette_xray':
    case 'silhouette_always':
    case 'silhouette_visible':
    case 'silhouette_never':
      return (device) => new NowDrawMaterial(device)
    case 'fxmeshadvanced':
      return (device, asset) => new FxMeshAdvancedMaterial(device, asset)
    case 'fxmeshadvancedtransp':
      return (device, asset) => new FxMeshAdvancedTranspMaterial(device, asset)
    case 'geometrybeam':
      return (device, asset) => new GeometryBeamMaterial(device, asset)
    case 'geometrybeamsimple':
      return (device, asset) => new GeometryBeamSimpleMaterial(device, asset)
    case 'geometryfog':
    case 'geometryfognovertalpha':
      return (device, asset) => new GeometryFogMaterial(device, asset)
    case 'vegetation':
      return (device, asset) => new VegetationMaterial(device, asset)
    case 'distanceclouds':
      return (device, options) => new DistanceCloudsMaterial(device, options)
    case 'meshparticle':
      return (device, options) => new MeshparticleMaterial(device, options)
    case 'particleimposter':
      return (device, options) => new ParticleImposterMaterial(device, options)
    case 'water':
      return (device, options) => new WaterPatchMaterial(device, options)
    case 'watervolume':
      return (device, options) => new WaterVolumeMaterial(device, options)
    default:
      console.warn('Unknown shader', shader, stringGenMask)
      return (device) => new UnknownMaterial(device, { properties: {} })
  }
}
