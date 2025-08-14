import {
  AbstractMesh,
  BaseTexture,
  Engine,
  IColor3Like,
  Material,
  MaterialDefines,
  MaterialPluginBase,
  RegisterMaterialPlugin,
  Scene,
  ShaderLanguage,
  SubMesh,
  UniformBuffer,
} from '@babylonjs/core'
import { NwMaterialExtension } from './nw-material-extension'

export const NW_MATERIAL_PLUGIN_NAME = 'NwMaterialPlugin'
export class NwMaterialPlugin extends MaterialPluginBase {
  public static register() {
    NwMaterialExtension.register()
    RegisterMaterialPlugin(NW_MATERIAL_PLUGIN_NAME, (material) => {
      const instance = new NwMaterialPlugin(material)
      NwMaterialPlugin.setPlugin(material, instance)
      return instance
    })
  }

  public static getPlugin(material: Material | null): NwMaterialPlugin | null {
    return (material as any)?.[NW_MATERIAL_PLUGIN_NAME] || null
  }

  public static setPlugin(material: Material, plugin: NwMaterialPlugin) {
    Object.assign(material, {
      [NW_MATERIAL_PLUGIN_NAME]: plugin,
    })
  }

  public nwMaskR = 0
  public nwMaskROverride = 0
  public nwMaskRColor: IColor3Like = { r: 0.0, g: 0.0, b: 0.0 }

  public nwMaskG = 0
  public nwMaskGOverride = 0
  public nwMaskGColor: IColor3Like = { r: 0.0, g: 0.0, b: 0.0 }

  public nwMaskB = 0
  public nwMaskBOverride = 0
  public nwMaskBColor: IColor3Like = { r: 0.0, g: 0.0, b: 0.0 }

  public nwMaskASpecOverride = 0
  public nwMaskASpec: IColor3Like = { r: 0.0, g: 0.0, b: 0.0 }

  public nwMaskGloss = 0
  public nwMaskGlossShift = 0.5

  public get nwMaskTexture() {
    return NwMaterialExtension.getMaskTexture(this._material)
  }

  public get nwSmoothTexture() {
    return NwMaterialExtension.getSmoothTexture(this._material)
  }

  public get isMaskEnabled() {
    return !!this._isMaskEnabled
  }
  public set isMaskEnabled(enabled) {
    if (this._isMaskEnabled !== enabled) {
      this._isMaskEnabled = enabled
      this.handleChange()
    }
  }

  public get debugMask() {
    return !!this._isMaskDebug
  }
  public set debugMask(value) {
    if (this._isMaskDebug !== value) {
      this._isMaskDebug = value
      this.handleChange()
    }
  }

  public get isSmoothEnabled() {
    return !!this._isSmoothEnabled
  }
  public set isSmoothEnabled(enabled) {
    if (this._isSmoothEnabled !== enabled) {
      this._isSmoothEnabled = enabled
      this.handleChange()
    }
  }

  private _isMaskDebug: boolean = null
  private _isMaskEnabled: boolean = null
  private _isSmoothEnabled: boolean = null

  public constructor(material: Material) {
    super(
      material,
      'NwOverlayMask',
      200,
      {
        NW_SMOOTH_MAP: false,
        NW_OVERLAY_MASK: false,
        NW_OVERLAY_DEBUG: false,
        WORLD_UBO: false,
      },
      true,
    )
  }

  public handleChange() {
    this.markAllDefinesAsDirty()
    this._enable(this.isMaskEnabled || this.isSmoothEnabled)
  }

  public onLoaded() {
    this._isMaskEnabled = !!this.nwMaskTexture
    this._isSmoothEnabled = !!this.nwSmoothTexture
    this._isMaskDebug = false
    this.handleChange()
  }

  public override getClassName() {
    return NW_MATERIAL_PLUGIN_NAME
  }

  public override isCompatible(shaderLanguage: ShaderLanguage): boolean {
    return shaderLanguage === ShaderLanguage.GLSL
  }

  public override hasTexture(texture: BaseTexture): boolean {
    if (this.nwMaskTexture === texture) {
      return true
    }
    if (this.nwSmoothTexture === texture) {
      return true
    }
    return false
  }

  public override getActiveTextures(activeTextures: BaseTexture[]): void {
    if (this.nwMaskTexture) {
      activeTextures.push(this.nwMaskTexture)
    }
    if (this.nwSmoothTexture) {
      activeTextures.push(this.nwSmoothTexture)
    }
  }

  public override prepareDefines(defines: MaterialDefines, scene: Scene, mesh: AbstractMesh) {
    defines['NW_SMOOTH_MAP'] = this.isSmoothEnabled
    defines['NW_OVERLAY_MASK'] = this.isMaskEnabled
    defines['NW_OVERLAY_DEBUG'] = this.debugMask
    defines['WORLD_UBO'] = this.isMaskEnabled || this.isSmoothEnabled
    defines['MAINUV1'] = true // ensure vMainUV1 is defined
  }

  public override getUniforms(lang: ShaderLanguage) {
    return {
      ubo: [
        { name: 'nwMaskRGBA', size: 4, type: 'vec4' },
        { name: 'nwMaskRColor', size: 4, type: 'vec4' },
        { name: 'nwMaskGColor', size: 4, type: 'vec4' },
        { name: 'nwMaskBColor', size: 4, type: 'vec4' },
        { name: 'nwMaskASpec', size: 4, type: 'vec4' },
        { name: 'nwMaskGloss', size: 2, type: 'vec2' },
      ],
      fragment: `
        #ifdef NW_OVERLAY_MASK
          uniform vec4 nwMaskRGBA;
          uniform vec4 nwMaskRColor;
          uniform vec4 nwMaskGColor;
          uniform vec4 nwMaskBColor;
          uniform vec4 nwMaskASpec;
          uniform vec2 nwMaskGloss;
        #endif
        #ifdef NW_SMOOTH_MAP
          // smooth map
        #endif
        `,
    }
  }

  public override getSamplers(samplers: string[]) {
    samplers.push('nwMaskTexture', 'nwSmoothTexture')
  }

  public override bindForSubMesh(uniformBuffer: UniformBuffer, scene: Scene, engine: Engine, subMesh: SubMesh) {
    if (this.isMaskEnabled) {
      uniformBuffer.updateColor4(
        'nwMaskRGBA',
        {
          r: this.nwMaskR,
          g: this.nwMaskG,
          b: this.nwMaskB,
        },
        this.nwMaskTexture ? 1 : 0,
      )
      uniformBuffer.updateColor4('nwMaskRColor', this.nwMaskRColor, this.nwMaskROverride)
      uniformBuffer.updateColor4('nwMaskGColor', this.nwMaskGColor, this.nwMaskGOverride)
      uniformBuffer.updateColor4('nwMaskBColor', this.nwMaskBColor, this.nwMaskBOverride)
      uniformBuffer.updateColor4('nwMaskASpec', this.nwMaskASpec, this.nwMaskASpecOverride)
      uniformBuffer.updateFloat2('nwMaskGloss', this.nwMaskGloss, this.nwMaskGlossShift)
      uniformBuffer.setTexture('nwMaskTexture', this.nwMaskTexture)
    } else {
      uniformBuffer.setTexture('nwMaskTexture', null)
    }
    uniformBuffer.setTexture('nwSmoothTexture', this.nwSmoothTexture || null)
  }

  public override getCustomCode(shaderType: string) {
    if (shaderType === 'vertex') {
      return null
    }
    return {
      CUSTOM_FRAGMENT_DEFINITIONS: /*glsl*/ `
        uniform sampler2D nwMaskTexture;
        uniform sampler2D nwSmoothTexture;
        vec3 overlayBlend(vec3 luminance, vec3 color) {
          vec3 c0 = 2.0f * luminance * color;
          vec3 c1 = 1.0f - 2.0f * (1.0f - luminance) * (1.0f - color);
          return mix(c0, c1, step(vec3(0.5f, 0.5f, 0.5f), luminance));
        }
      `,
      CUSTOM_FRAGMENT_UPDATE_ALBEDO: /*glsl*/ `
        #ifdef NW_OVERLAY_MASK

          vec4 nwMask = texture2D(nwMaskTexture, vMainUV1) * nwMaskRGBA.a;

          float luminance = dot(surfaceAlbedo.rgb, vec3(0.2125, 0.7154, 0.0721));

          vec3 maskColorR = mix(overlayBlend(vec3(luminance), nwMaskRColor.rgb), nwMaskRColor.rgb * nwMaskRColor.rgb, nwMaskRColor.a);
          vec3 maskColorG = mix(overlayBlend(vec3(luminance), nwMaskGColor.rgb), nwMaskGColor.rgb * nwMaskGColor.rgb, nwMaskGColor.a);
          vec3 maskColorB = mix(overlayBlend(vec3(luminance), nwMaskBColor.rgb), nwMaskBColor.rgb * nwMaskBColor.rgb, nwMaskBColor.a);

          surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, maskColorR, nwMask.r * nwMaskRGBA.r);
          surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, maskColorG, nwMask.g * nwMaskRGBA.g);
          surfaceAlbedo.rgb = mix(surfaceAlbedo.rgb, maskColorB, nwMask.b * nwMaskRGBA.b);

          #ifdef NW_OVERLAY_DEBUG
          surfaceAlbedo.rgb = nwMask.rgb * 0.5 + vec3(0.5, 0.0, 0.5) * nwMask.a;
          #endif
        #endif
        // #ifdef NW_SMOOTH_MAP
        //   surfaceAlbedo.rgb = texture2D(nwSmoothTexture, vMainUV1).rgb;
        // #endif
      `,
      '!float\\smicroSurface=reflectivityOut.microSurface;': /*glsl*/ `
        #ifdef NW_OVERLAY_MASK
          vec4 nwMask = texture2D(nwMaskTexture, vMainUV1) * nwMaskRGBA.a;
          reflectivityOut.colorReflectanceF0 = mix(reflectivityOut.colorReflectanceF0, nwMaskASpec.rgb, nwMask.a * nwMaskASpec.a) ;

          float nwMaskRoughness = reflectivityOut.roughness;
          nwMaskRoughness = mix(0.0, nwMaskRoughness, saturate(nwMaskGloss.y / 0.5));
          nwMaskRoughness = mix(nwMaskRoughness, 1.0, saturate((nwMaskGloss.y - 0.5) / 0.5));
          reflectivityOut.roughness = mix(reflectivityOut.roughness, nwMaskRoughness, nwMask.a * nwMaskGloss.x);

        #endif
        float microSurface=reflectivityOut.microSurface;
      `,
      '!vec4\\ssurfaceMetallicOrReflectivityColorMap=texture(reflectivitySampler,vReflectivityUV+uvOffset);': /*glsl*/ `
        vec4 surfaceMetallicOrReflectivityColorMap=texture(reflectivitySampler,vReflectivityUV+uvOffset);
        #ifdef NW_SMOOTH_MAP
          surfaceMetallicOrReflectivityColorMap.a = texture(nwSmoothTexture, vReflectivityUV+uvOffset).r;
        #endif
      `,
      //
    }
  }
}
