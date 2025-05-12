import { ShaderMaterial, Texture, Vector2 } from 'three'

const VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  uniform vec2 offset;
  uniform float scale;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
    gl_Position.xy = gl_Position.xy * scale + offset * 2.0; // TODO: understand why this is 2.0
  }
`
const FRAGMENT_SHADER = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D texture1;
  void main() {
    // gl_FragColor = vec4(1.0, 0.25, 0.25, 1.0);
    // gl_FragColor = vec4(vUv.x, vUv.y,  0.0, 1.0);
    gl_FragColor = texture(texture1, vUv);
    // gl_FragColor = mix(texture(texture1, vUv), vec4(vUv.x, vUv.y,  0.0, 1.0), 0.5);
  }
`

export class ClipmapUpdateMaterial extends ShaderMaterial {
  public set texture1(value: Texture) {
    this.uniforms['texture1'].value = value
  }
  public setOffset(x: number, y: number) {
    this.uniforms['offset'].value.set(x, y);
  }
  public setScale(value: number) {
    this.uniforms['scale'].value = value
  }
  public constructor() {
    super({
      uniforms: {
        texture1: { value: null },
        offset: { value: new Vector2(0, 0) },
        scale: { value: 1 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    })
  }
}
