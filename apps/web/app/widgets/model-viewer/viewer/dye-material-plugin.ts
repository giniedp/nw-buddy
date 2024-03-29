import 'babylonjs'
import { BABYLON, ViewerModel } from 'babylonjs-viewer'
import { getMaskTexture } from './dye-loader-extension'
import { Scene } from 'babylonjs'
import { Dyecolors } from '@nw-data/generated'

const NAME = 'DyeMaterialPlugin'

export function registerDyePlugin() {
  BABYLON.RegisterMaterialPlugin(NAME, (material) => {
    const instance = new DyeMaterialPlugin(material)
    DyeMaterialPlugin.setPlugin(material, instance)
    return instance
  })
}

export class DyeMaterialPlugin extends BABYLON.MaterialPluginBase {
  public static getPlugin(material: BABYLON.Material | null): DyeMaterialPlugin | null {
    return (material as any)?.[NAME] || null
  }

  public static setPlugin(material: BABYLON.Material, plugin: DyeMaterialPlugin) {
    Object.assign(material, {
      [NAME]: plugin,
    })
  }

  public dyeColorR = new BABYLON.Color4(0.0, 0.0, 0.0, 0.0)
  public dyeColorG = new BABYLON.Color4(0.0, 0.0, 0.0, 0.0)
  public dyeColorB = new BABYLON.Color4(0.0, 0.0, 0.0, 0.0)
  public dyeColorA = new BABYLON.Color4(0.0, 0.0, 0.0, 0.0)
  public dyeOverride = new BABYLON.Color4(0.0, 0.0, 0.0, 0.0)
  public get dyeMaskTexture() {
    return getMaskTexture(this._material)
  }

  public get isEnabled() {
    return this._isEnabled
  }
  public set isEnabled(enabled) {
    if (this._isEnabled === enabled) {
      return
    }
    this._isEnabled = enabled
    this.markAllDefinesAsDirty()
    this._enable(this._isEnabled)
  }

  public get debugMask() {
    return this._debugMask
  }
  public set debugMask(value) {
    if (this._debugMask === value) {
      return
    }
    this._debugMask = value
    this.markAllDefinesAsDirty()
  }

  public updateReflectivity(color: BABYLON.Color4 = this.dyeColorA) {
    const pbr = this._material as BABYLON.PBRMaterial
    if (pbr.reflectivityColor) {
      pbr.reflectivityColor.set(
        1 - color.a + color.r * color.a,
        1 - color.a + color.g * color.a,
        1 - color.a + color.b * color.a
      )
    }
  }

  private _isEnabled = false
  private _debugMask = false

  public constructor(material: BABYLON.Material) {
    super(material, 'Dye', 200, {
      NW_DYE_ENABLED: false,
      NW_DYE_DEBUG: false,
    })
  }

  public override getClassName() {
    return NAME
  }

  // we use the define to enable or disable the plugin.
  public override prepareDefines(defines: BABYLON.MaterialDefines, scene: BABYLON.Scene, mesh: BABYLON.AbstractMesh) {
    Object.assign(defines, {
      NW_DYE_ENABLED: this._isEnabled,
      NW_DYE_DEBUG: this._debugMask,
    })
  }

  // here we can define any uniforms to be passed to the shader code.
  public override getUniforms() {
    return {
      ubo: [
        { name: 'dyeColorR', size: 4, type: 'vec4' },
        { name: 'dyeColorG', size: 4, type: 'vec4' },
        { name: 'dyeColorB', size: 4, type: 'vec4' },
        { name: 'dyeColorA', size: 4, type: 'vec4' },
        { name: 'dyeOverride', size: 4, type: 'vec4' },
      ],
      fragment: `
        #ifdef NW_DYE_ENABLED
          uniform vec4 dyeColorR;
          uniform vec4 dyeColorG;
          uniform vec4 dyeColorB;
          uniform vec4 dyeColorA;
          uniform vec4 dyeOverride;
        #endif
        `,
    }
  }

  public override getSamplers(samplers: string[]) {
    samplers.push('dyeMask')
  }

  // whenever a material is bound to a mesh, we need to update the uniforms.
  // so bind our uniform variable to the actual color we have in the instance.
  public override bindForSubMesh(
    uniformBuffer: BABYLON.UniformBuffer,
    scene: BABYLON.Scene,
    engine: BABYLON.Engine,
    subMesh: BABYLON.SubMesh
  ) {
    if (this._isEnabled) {
      uniformBuffer.updateColor4('dyeColorR', this.dyeColorR, this.dyeColorR.a)
      uniformBuffer.updateColor4('dyeColorG', this.dyeColorG, this.dyeColorG.a)
      uniformBuffer.updateColor4('dyeColorB', this.dyeColorB, this.dyeColorB.a)
      uniformBuffer.updateColor4('dyeColorA', this.dyeColorA, this.dyeColorA.a)
      uniformBuffer.updateColor4('dyeOverride', this.dyeOverride, this.dyeOverride.a)
      uniformBuffer.setTexture('dyeMask', this.dyeMaskTexture)
    }
  }

  public override getCustomCode(shaderType: string) {
    if (shaderType === 'vertex') {
      return null
    }
    return {
      CUSTOM_FRAGMENT_DEFINITIONS: `
        uniform sampler2D dyeMask;
      `,
      CUSTOM_FRAGMENT_UPDATE_ALBEDO: `
        #ifdef NW_DYE_ENABLED
          vec4 maskTexture = texture2D(dyeMask, vAlbedoUV);  

          float luminance = dot(surfaceAlbedo.rgb, vec3(0.299, 0.587, 0.114));

          vec3 surfaceDyeR = mix(luminance * dyeColorR.rgb, dyeColorR.rgb, dyeOverride.r);
          vec3 surfaceDyeG = mix(luminance * dyeColorG.rgb, dyeColorG.rgb, dyeOverride.g);
          vec3 surfaceDyeB = mix(luminance * dyeColorB.rgb, dyeColorB.rgb, dyeOverride.b);
          vec3 surfaceDyeA = mix(luminance * dyeColorA.rgb, dyeColorA.rgb, dyeOverride.a);

          surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, surfaceDyeR, maskTexture.r * dyeColorR.a);
          surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, surfaceDyeG, maskTexture.g * dyeColorG.a);
          surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, surfaceDyeB, maskTexture.b * dyeColorB.a);
          surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, surfaceDyeA, maskTexture.a);

          #ifdef NW_DYE_DEBUG
          //surfaceAlbedo.rgb = dyeColorA.rgb * maskTexture.a;
          surfaceAlbedo.rgb = mix(maskTexture.rgb, vec3(1.0, 0.0, 1.0), maskTexture.a);
          #endif
        #endif
      `,
      // '!vec4\\ssurfaceMetallicOrReflectivityColorMap\\s\\=\\stexture\\(reflectivitySampler,\\svReflectivityUV\\+uvOffset\\);': `
      //   vec4 surfaceMetallicOrReflectivityColorMap = texture(reflectivitySampler, vReflectivityUV + uvOffset);
      //   #ifdef NW_DYE_ENABLED
      //     vec3 dyeSpecColor = dyeColorA.rgb;
      //     float dyeSpecAmount = texture2D(dyeMask, vReflectivityUV + uvOffset).a;
      //     float dyeSpecShift = dyeOverride.a;
      //     vec3 refColor = surfaceMetallicOrReflectivityColorMap.rgb;
      //     float luminance = dot(refColor.rgb, vec3(0.299, 0.587, 0.114));

      //     //dyeSpecColor = mix(luminance * dyeSpecColor, dyeSpecColor, dyeSpecShift);
      //     //refColor.rgb = mix(refColor.rgb, dyeSpecColor.rgb, mask * dyeSpecAmount);

      //     surfaceMetallicOrReflectivityColorMap.rgb = refColor.rgb;

      //     #ifdef NW_DYE_DEBUG

      //     #endif
      //   #endif
      // `,
    }
  }
}

export function updateDyeChannel(options: {
  model: ViewerModel
  scene: Scene
  dyeR: Dyecolors | null
  dyeG: Dyecolors | null
  dyeB: Dyecolors | null
  dyeA: Dyecolors | null
  debugMask: boolean
  dyeEnabled: boolean
}) {
  options.scene.materials.forEach((material) => {
    const dye = DyeMaterialPlugin.getPlugin(material)
    if (!dye) {
      return
    }
    if (!options.dyeEnabled) {
      dye.isEnabled = false
      return
    }
    dye.isEnabled = true
    dye.debugMask = options.debugMask
    dye.dyeColorR.set(...dyeToRgba(options.dyeR))
    dye.dyeColorG.set(...dyeToRgba(options.dyeG))
    dye.dyeColorB.set(...dyeToRgba(options.dyeB))
    dye.dyeColorA.set(...dyeSpecToRgba(options.dyeA))
    dye.dyeOverride.set(
      options.dyeR?.ColorOverride || 0,
      options.dyeG?.ColorOverride || 0,
      options.dyeB?.ColorOverride || 0,
      (options.dyeA?.SpecAmount || 0) * (options.dyeA?.MaskGlossShift || 0)
    )
    dye.updateReflectivity()
  })
}

function dyeToRgba(dye: Dyecolors): [number, number, number, number] {
  if (!dye) {
    return [0, 0, 0, 0]
  }
  const rgb = hexToRgb(dye.Color)
  return [rgb.r, rgb.g, rgb.b, dye.ColorAmount]
}

function dyeSpecToRgba(dye: Dyecolors): [number, number, number, number] {
  if (!dye) {
    return [0, 0, 0, 0]
  }
  const rgb = hexToRgb(dye.SpecColor)
  return [rgb.r, rgb.g, rgb.b, dye.SpecAmount]
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (result) {
    return {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    }
  }
  return {
    r: 0,
    g: 0,
    b: 0,
  }
}
