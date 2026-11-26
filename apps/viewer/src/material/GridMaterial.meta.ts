import { inputSlot } from '@gglib/graphics'
export default {
  ModelMatrix: inputSlot('object', 'modelmatrix', 'mat4x4'),
  Transform: inputSlot('instances', 'transform', 'mat4x4'),
  Color: inputSlot('instances', 'color', 'vec4'),
}