import 'babylonjs'
import { BABYLON } from 'babylonjs-viewer'
import type { IColor3Like } from 'babylonjs/Maths/math.like'
import { NwMaterialExtension } from './nw-material-extension'

const NAME = 'NwMaterialPlugin'

export function registerNwMaterialPlugin() {
  BABYLON.RegisterMaterialPlugin(NAME, (material) => {
    const instance = new NwMaterialPlugin(material)
    NwMaterialPlugin.setPlugin(material, instance)
    return instance
  })
}

export class NwMaterialPlugin extends BABYLON.MaterialPluginBase {
  public static getPlugin(material: BABYLON.Material | null): NwMaterialPlugin | null {
    return (material as any)?.[NAME] || null
  }

  public static setPlugin(material: BABYLON.Material, plugin: NwMaterialPlugin) {
    Object.assign(material, {
      [NAME]: plugin,
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

  private _isEnabled = false
  private _debugMask = false

  public constructor(material: BABYLON.Material) {
    super(material, 'NwOverlayMask', 200, {
      NW_OVERLAY_MASK: false,
      NW_OVERLAY_DEBUG: false,
      WORLD_UBO: false,
    })
  }

  public override getClassName() {
    return NAME
  }

  public override prepareDefines(defines: BABYLON.MaterialDefines, scene: BABYLON.Scene, mesh: BABYLON.AbstractMesh) {
    defines['NW_OVERLAY_MASK'] = this._isEnabled
    defines['NW_OVERLAY_DEBUG'] = this._debugMask
    defines['WORLD_UBO'] = this._isEnabled
  }

  public override getUniforms() {
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
        `,
    }
  }

  public override getSamplers(samplers: string[]) {
    samplers.push('nwMaskTexture')
  }

  public override bindForSubMesh(
    uniformBuffer: BABYLON.UniformBuffer,
    scene: BABYLON.Scene,
    engine: BABYLON.Engine,
    subMesh: BABYLON.SubMesh,
  ) {
    if (this._isEnabled) {
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
  }

  public override getCustomCode(shaderType: string) {
    if (shaderType === 'vertex') {
      return null
    }
    return {
      CUSTOM_FRAGMENT_DEFINITIONS: `
        uniform sampler2D nwMaskTexture;
        vec3 overlayBlend(vec3 luminance, vec3 color) {
          vec3 c0 = 2.0f * luminance * color;
          vec3 c1 = 1.0f - 2.0f * (1.0f - luminance) * (1.0f - color);
          return mix(c0, c1, step(vec3(0.5f, 0.5f, 0.5f), luminance));
        }
      `,
      CUSTOM_FRAGMENT_UPDATE_ALBEDO: `
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
      `,
      '!float\\smicroSurface=reflectivityOut.microSurface;': `
        #ifdef NW_OVERLAY_MASK
          vec4 nwMask = texture2D(nwMaskTexture, vMainUV1) * nwMaskRGBA.a;
          reflectivityOut.surfaceReflectivityColor = mix(reflectivityOut.surfaceReflectivityColor, nwMaskASpec.rgb, nwMask.a * nwMaskASpec.a) ;

          float nwMaskRoughness = reflectivityOut.roughness;
          nwMaskRoughness = mix(0.0, nwMaskRoughness, saturate(nwMaskGloss.y / 0.5));
          nwMaskRoughness = mix(nwMaskRoughness, 1.0, saturate((nwMaskGloss.y - 0.5) / 0.5));
          reflectivityOut.roughness = mix(reflectivityOut.roughness, nwMaskRoughness, nwMask.a * nwMaskGloss.x);

        #endif
        float microSurface=reflectivityOut.microSurface;
      `,
    }
  }
}
