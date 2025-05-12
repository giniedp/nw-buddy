import { IShaderPath, Scene, ShaderMaterial, Texture } from '@babylonjs/core'

const VERTEX_SHADER = /* glsl */ `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;

  uniform mat4 world;

  varying vec2 vUV;

  void main() {
    vUV = uv;
    gl_Position = world * vec4(position, 1.0);
    // to clip space, from [0, 0, 1, 1] to [-1, -1, 1, 1]
    gl_Position.xy = gl_Position.xy * 2.0 - 1.0;
  }
`
const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  varying vec2 vUV;

  uniform sampler2D texture1;

  void main() {
    // gl_FragColor = vec4(1.0, 0.5, 0.5, 1.0);
    //gl_FragColor = vec4(vUV.xy, 0.0, 1.0);
    gl_FragColor = texture(texture1, vUV);
    // gl_FragColor.a = 1.0;
  }
`

const source: IShaderPath = {
  vertexSource: VERTEX_SHADER,
  fragmentSource: FRAGMENT_SHADER,
}
export class ClipmapUpdateMaterial extends ShaderMaterial {
  public readonly params = {
    setTexture: (value: Texture) => {
      if  (value) {
        this.setTexture('texture1', value)
      } else {
        this.removeTexture('texture1')
      }
    },
  }

  public constructor(name: string, scene: Scene) {
    super(name, scene, source, {
      attributes: ['position', 'uv'],
      uniforms: ['world'],
      samplers: ['texture1'],
    })
  }
}
