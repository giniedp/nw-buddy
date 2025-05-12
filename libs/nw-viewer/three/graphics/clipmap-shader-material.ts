import { MeshStandardMaterial, Texture, Vector2, WebGLProgramParametersWithUniforms, WebGLRenderer } from "three";
import './shader-lib'

export class ClipmapShaderMaterial extends MeshStandardMaterial {

  private params: WebGLProgramParametersWithUniforms


  public coarseCenter: Vector2 = new Vector2()
  public coarseOrigin: Vector2 = new Vector2()
  public coarseBlend: number = 0
  public clipCenter: Vector2 = new Vector2()
  public clipOrigin: Vector2 = new Vector2()
  public clipSize: number = 0
  public clipDensity: number = 0
  public clipHeight: number = 2048
  public clipTex1: Texture
  public clipTex2: Texture

  public constructor() {
    super()
  }

  override onBeforeCompile(parameters: WebGLProgramParametersWithUniforms, renderer: WebGLRenderer): void {
    parameters.defines['USE_CLIPMAP'] = ""
    parameters.defines['USE_UV'] = ""
    this.params = parameters
    this.params.uniforms['coarseCenter'] = { value: new Vector2() }
    this.params.uniforms['coarseOrigin'] = { value: new Vector2() }
    this.params.uniforms['coarseBlend'] = { value: 0 }
    this.params.uniforms['clipCenter'] = { value: new Vector2() }
    this.params.uniforms['clipOrigin'] = { value: new Vector2() }
    this.params.uniforms['clipSize'] = { value: 0 }
    this.params.uniforms['clipDensity'] = { value: 0 }
    this.params.uniforms['clipHeight'] = { value: 0 }
    this.params.uniforms['clipTex1'] = { value: null }
    this.params.uniforms['clipTex2'] = { value: null }
  }

  override onBeforeRender(): void {
    if (!this.params) {
      return
    }
    this.params.uniforms['coarseCenter'].value.copy(this.coarseCenter)
    this.params.uniforms['coarseOrigin'].value.copy(this.coarseOrigin)
    this.params.uniforms['coarseBlend'].value = this.coarseBlend
    this.params.uniforms['clipCenter'].value.copy(this.clipCenter)
    this.params.uniforms['clipOrigin'].value.copy(this.clipOrigin)
    this.params.uniforms['clipSize'].value = this.clipSize
    this.params.uniforms['clipDensity'].value = this.clipDensity
    this.params.uniforms['clipHeight'].value = this.clipHeight
    this.params.uniforms['clipTex1'].value = this.clipTex1
    this.params.uniforms['clipTex2'].value = this.clipTex2
  }
}
