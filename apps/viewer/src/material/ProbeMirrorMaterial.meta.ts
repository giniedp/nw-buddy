import { inputSlot } from '@gglib/graphics'
export default {
  Sphere: inputSlot('material', 'sphere', 'vec4'),
  Params: inputSlot('material', 'params', 'vec4'),
  SamplerLinear: inputSlot('', 'samplerLinear', 'sampler'),
  SpecularCubes: inputSlot('', 'specularCubes', 'texture'),
  DiffuseCubes: inputSlot('', 'diffuseCubes', 'texture'),
}