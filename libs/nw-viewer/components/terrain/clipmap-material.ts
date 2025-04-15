import {
  IShaderPath,
  IVector2Like,
  IVector3Like,
  Scene,
  ShaderMaterial,
  Texture,
  TextureSampler,
} from '@babylonjs/core'

const VERTEX_SHADER = /* wgsl */ `
  precision highp float;
  attribute vec3 position;
  attribute vec3 normal;
  attribute vec4 color;

  uniform mat4 world;
  uniform mat4 view;
  uniform mat4 projection;

  uniform vec3 eyePosition;
  uniform vec2 clipCenter;
  uniform vec2 clipOrigin;
  uniform float clipSize;
  uniform float clipDensity;
  uniform sampler2D heightmap;
  uniform float heightmapTexel;

  varying vec2 vUV;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vBlend;

  // Calculates the blend factor to morph between LOD levels
  // p: current position in world space
  // N: Number of vertices on a side of the clip (Clipsize)
  // G: Units between vertices (Density)
  // center: camera position projected on the xy plane
  float calculateBlend(vec2 p, float N, float G, vec2 center) {
    float ng =  N * G;
    vec2 d = abs(p - center);
    d -= ((ng - G) / 2.0 - ng / 10.0 - 2.0 * G);
    d /= (ng / 10.0);
    return clamp(max(d.x, d.y), 0.0, 1.0);
  }

  vec3 calculateNormal(vec2 uv, float scale) {
    float heightL = texture(heightmap, uv - vec2(heightmapTexel, 0.0)).r;
    float heightR = texture(heightmap, uv + vec2(heightmapTexel, 0.0)).r;
    float heightD = texture(heightmap, uv - vec2(0.0, heightmapTexel)).r;
    float heightU = texture(heightmap, uv + vec2(0.0, heightmapTexel)).r;
    // Compute gradient
    float dx = (heightR - heightL) * scale;
    float dy = (heightU - heightD) * scale;
    return normalize(vec3(-dx, -dy, 1.0));
  }

  float decodeHeight(vec3 color) {
    // Convert RGB components from [0.0, 1.0] to [0, 255]
    vec3 rgb = color.rgb * 255.0;
    // Reconstruct the 24-bit integer value
    float value = rgb.r * 65536.0 + rgb.g * 256.0 + rgb.b;
    // Convert back to height in range [0.0, 65535.0]
    value = value * (65535.0 / 16777215.0);
    // convert to [0.0, 2048.0]
    value = value * (2048.0 / 65535.0);
    return value;
  }

  void main() {
    vec4 p = vec4(position, 1.0);

    vWorldPos = (world * p).xyz;
    vBlend = calculateBlend(vWorldPos.xz, clipSize, clipDensity, eyePosition.xz);
    vColor = color.rgb;
    vUV = ((vWorldPos.xz - clipOrigin.xy) / clipDensity) * heightmapTexel;// + 0.5 * heightmapTexel;
    vWorldPos.y = decodeHeight(texture(heightmap, vUV).xyz);
    vNormal = calculateNormal(vUV, 2048.0);
    gl_Position = projection * view * vec4(vWorldPos, 1.0);
  }
`
const FRAGMENT_SHADER = /* wgsl */ `
  precision highp float;

  varying vec2 vUV;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vBlend;
  uniform sampler2D heightmap;
  uniform sampler2D groundmap;

  void main() {
    // gl_FragColor = vec4(vBlend, vBlend, vBlend, 1.0);
    //gl_FragColor = vec4(vUV.x, vUV.y, 0.0, 1.0);
    // gl_FragColor = vec4(mix(vColor.rgb, vec3(vUV.x, vUV.y, 1.0), vBlend), 1.0);
    // gl_FragColor = vec4(mix(vColor.rgb, vec3(0.5, 0.5, 1.0), vBlend), 1.0);

    //vec3 color = texture(heightmap, vUV).xyz;
    vec3 color = texture(groundmap, vUV).xyz;
    gl_FragColor.rgb = color;
    //gl_FragColor.rgb = mix(vNormal, vColor.rgb, 0.85);
    gl_FragColor.a = 1.0;
  }
`
const SHADER_SOURCE: IShaderPath = {
  vertexSource: VERTEX_SHADER,
  fragmentSource: FRAGMENT_SHADER,
}
export class ClipmapMaterial extends ShaderMaterial {
  private pointSampler: TextureSampler = new TextureSampler()
  public readonly params = {
    setClipDensity: (value: number) => {
      this.setFloat('clipDensity', value)
    },
    setClipSize: (value: number) => {
      this.setFloat('clipSize', value)
    },
    setClipCenter: (value: IVector2Like) => {
      this.setVector2('clipCenter', value)
    },
    setClipOrigin: (value: IVector2Like) => {
      this.setVector2('clipOrigin', value)
    },
    setEyePosition: (value: IVector3Like) => {
      this.setVector3('eyePosition', value)
    },
    setHeightmap: (value: Texture) => {
      this.setTexture('heightmap', value)
    },
    setHeightmapTexel: (value: number) => {
      this.setFloat('heightmapTexel', value)
    },
    setGroundmap: (value: Texture) => {
      this.setTexture('groundmap', value)
    },
  }
  public constructor(name: string, scene: Scene) {
    super(name, scene, SHADER_SOURCE, {
      attributes: ['position', 'normal', 'color'],
      uniforms: ['world', 'view', 'projection', 'clipCenter', 'clipOrigin', 'clipSize', 'clipDensity', 'eyePosition'],
    })
    this.pointSampler.samplingMode = Texture.NEAREST_SAMPLINGMODE
    this.pointSampler.wrapU = Texture.CLAMP_ADDRESSMODE
    this.pointSampler.wrapV = Texture.CLAMP_ADDRESSMODE
  }
}
