import { Color, MeshPhysicalMaterial, SRGBColorSpace } from 'three'
import { GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader'

const EXTENSION_NAME = 'KHR_materials_pbrSpecularGlossiness'
interface SpecularGlossinessExtensionData {
  diffuseFactor: [number, number, number, number]
  diffuseTexture: {
    index: number
    texCoord?: number | undefined
    extensions?: any
  }
  specularFactor: [number, number, number]
  glossinessFactor: number
  specularGlossinessTexture: {
    index: number
    texCoord?: number | undefined
    extensions?: any
  }
}

export class GLTFSpecularGlossinessExtension {
  public parser: GLTFParser
  public name: string
  constructor(parser: GLTFParser) {
    this.parser = parser
    this.name = EXTENSION_NAME
  }

  private getMaterialDef(materialIndex: number) {
    return this.parser.json.materials[materialIndex]
  }

  private getData(materialIndex: number) {
    const materialDef = this.getMaterialDef(materialIndex)
    return materialDef?.extensions?.[this.name] as SpecularGlossinessExtensionData
  }

  public getMaterialType(materialIndex: number) {
    if (!this.getData(materialIndex)) {
      return null
    }
    return MeshPhysicalMaterial
  }

  public extendMaterialParams(materialIndex: number, materialParams: any) {
    const parser = this.parser
    const extension = this.getData(materialIndex)
    if (!extension) {
      return Promise.resolve()
    }

    const pending = []
    const options = convertToMetallicRoughness(extension)
    // console.log('opts', options)
    materialParams.metalness = options.metallic
    materialParams.roughness = options.roughness
    // prettier-ignore
    materialParams.color = new Color(
      options.diffuseFactor[0],
      options.diffuseFactor[1],
      options.diffuseFactor[2],
    )
    materialParams.opacity = options.opacity
    // prettier-ignore
    materialParams.specularColor = new Color(
      options.specularFactor[0],
      options.specularFactor[1],
      options.specularFactor[2],
    )
    materialParams.ior = 0
    materialParams.iridescenceIOR = 0

    if (extension.diffuseTexture) {
      const texture = extension.diffuseTexture
      pending.push(parser.assignTexture(materialParams, 'map', texture, SRGBColorSpace))
    }
    if (extension.specularGlossinessTexture) {
      const texture = extension.specularGlossinessTexture
      pending.push(parser.assignTexture(materialParams, 'specularColorMap', texture, SRGBColorSpace))
      // will be set by nw-material-extension
      // pending.push(parser.assignTexture(materialParams, 'specularIntensityMap', texture, SRGBColorSpace))
    }

    return Promise.all(pending)
  }
}

const dielectricSpecular = [0.04, 0.04, 0.04]
const epsilon = 1e-6

function convertToMetallicRoughness(specularGlossiness: SpecularGlossinessExtensionData) {

  const diffuse = specularGlossiness.diffuseFactor || [1, 1, 1, 1]
  const specular = specularGlossiness.specularFactor || [1, 1, 1]
  const glossiness = specularGlossiness.glossinessFactor ?? 1

  // const oneMinusSpecularStrength = 1 - Math.max(...specular)
  // const metallic = solveMetallic(
  //   perceivedBrightness(diffuse[0], diffuse[1], diffuse[2]),
  //   perceivedBrightness(specular[0], specular[1], specular[2]),
  //   oneMinusSpecularStrength,
  // )
  // const scale = oneMinusSpecularStrength / (1 - dielectricSpecular[0]) / Math.max(1 - metallic, epsilon)
  // prettier-ignore
  // const baseColorFromDiffuse = [
  //   diffuse[0] * scale,
  //   diffuse[1] * scale,
  //   diffuse[2] * scale,
  // ]
  // const baseColorFromSpecular = [
  //   (specular[0] + dielectricSpecular[0] * (1 - metallic)) * (1 / Math.max(metallic, epsilon)),
  //   (specular[1] + dielectricSpecular[1] * (1 - metallic)) * (1 / Math.max(metallic, epsilon)),
  //   (specular[2] + dielectricSpecular[2] * (1 - metallic)) * (1 / Math.max(metallic, epsilon)),
  // ]
  // const baseColor = [
  //   clamp(baseColorFromDiffuse[0] * (1 - metallic) + baseColorFromSpecular[0] * metallic, 0, 1),
  //   clamp(baseColorFromDiffuse[1] * (1 - metallic) + baseColorFromSpecular[1] * metallic, 0, 1),
  //   clamp(baseColorFromDiffuse[2] * (1 - metallic) + baseColorFromSpecular[2] * metallic, 0, 1),
  // ]
  const baseColor = [
    diffuse[0],
    diffuse[1],
    diffuse[2],
  ]

  return {
    opacity: diffuse[3],
    metallic: 0.0,// metallic,
    roughness: 1 - glossiness,
    diffuseFactor: baseColor,
    specularFactor: specular,
  }
}

function solveMetallic(diffuse: number, specular: number, oneMinusSpecularStrength: number) {
  if (specular < dielectricSpecular[0]) {
    return 0
  }
  const a = dielectricSpecular[0]
  const b = (diffuse * oneMinusSpecularStrength) / (1 - dielectricSpecular[0]) + specular - 2 * dielectricSpecular[0]
  const c = dielectricSpecular[0] - specular
  const D = b * b - 4 * a * c
  return clamp((-b + Math.sqrt(D)) / (2 * a), 0, 1)
}

function perceivedBrightness(r: number, g: number, b: number) {
  return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
