import { CommonBlocks, type InputSlot } from '@gglib/graphics'
import { describe, expect, it } from 'vitest'
import { inputBlocks, inputWidget, scalarRange } from './inputs'

const slot = (block: string, input: string, type: string) => ({ key: input, block, input, type }) as InputSlot

describe('inputBlocks', () => {
  it('groups the material block and the inputs without a block, in order', () => {
    const schema = {
      a: slot(CommonBlocks.Material, 'Diffuse', 'vec4'),
      b: slot('', 'Opacity', 'scalar'),
      c: slot(CommonBlocks.Material, 'Gloss', 'scalar'),
    }
    const blocks = inputBlocks(schema)
    expect(blocks.map((it) => it.name)).toEqual([CommonBlocks.Material, ''])
    expect(blocks[0].inputs.map((it) => it.input)).toEqual(['Diffuse', 'Gloss'])
  })

  it('leaves out the blocks the engine sets', () => {
    expect(inputBlocks({ a: slot('View', 'Projection', 'mat4') })).toEqual([])
  })

  it('is empty without a schema', () => {
    expect(inputBlocks(null)).toEqual([])
  })
})

describe('inputWidget', () => {
  it('edits vectors named like a color as colors', () => {
    expect(inputWidget({ type: 'vec3', input: 'DiffuseColor' })).toBe('color')
    expect(inputWidget({ type: 'vec4', input: 'emissiveColor' })).toBe('color')
    expect(inputWidget({ type: 'vec2', input: 'Color' })).toBe('vector')
  })

  it('has a widget for scalars, vectors and textures only', () => {
    expect(inputWidget({ type: 'scalar', input: 'Gloss' })).toBe('scalar')
    expect(inputWidget({ type: 'vec3', input: 'Offset' })).toBe('vector')
    expect(inputWidget({ type: 'texture', input: 'Diffuse' })).toBe('texture')
    expect(inputWidget({ type: 'sampler', input: 'Diffuse' })).toBeNull()
  })
})

describe('scalarRange', () => {
  it('takes the params of the game, by lower case name', () => {
    expect(scalarRange('AlphaMultiplier')).toEqual({ min: 0.1, max: 6, step: 0.05, range: true })
  })

  it('is unbounded for unknown inputs', () => {
    expect(scalarRange('NoSuchInput')).toEqual({ min: undefined, max: undefined, step: undefined, range: false })
  })
})
