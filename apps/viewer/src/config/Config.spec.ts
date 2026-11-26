import { describe, expect, it } from 'vitest'
import { Config, type ConfigStorage } from './Config'
import { boolean, choice, defineConfig, integer, number, vec3 } from './properties'

const schema = defineConfig({
  targetSize: number({ description: 'a number', editable: true, default: 0.005, min: 0.001, max: 0.01 }),
  maxLevel: integer({ description: 'an integer', editable: true, default: 5, min: 0, max: 5 }),
  enabled: boolean({ description: 'a fixed flag', editable: false, default: true }),
  mode: choice({ description: 'a choice', editable: true, options: ['a', 'b'], default: 'a' }),
  color: vec3({ description: 'a vector', editable: true, default: [1, 2, 3] }),
})

function memoryStorage(): ConfigStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  }
}

function createConfig(storage = memoryStorage()) {
  return { config: new Config(schema, { storageKey: 'test', storage }), storage }
}

describe('Config', () => {
  it('starts with the defaults', () => {
    const { config } = createConfig()
    expect(config.value).toEqual({ targetSize: 0.005, maxLevel: 5, enabled: true, mode: 'a', color: [1, 2, 3] })
    expect(config.names).toEqual(['targetSize', 'maxLevel', 'enabled', 'mode', 'color'])
  })

  it('sets editable values, clamps numbers and rounds integers', () => {
    const { config } = createConfig()
    expect(config.set('maxLevel', 3.6)).toBe(true)
    expect(config.value.maxLevel).toBe(4)
    config.set('targetSize', 1)
    expect(config.value.targetSize).toBe(0.01)
    expect(config.isModified('targetSize')).toBe(true)
  })

  it('rejects fixed properties and invalid values', () => {
    const { config } = createConfig()
    expect(config.set('enabled', false)).toBe(false)
    expect(config.value.enabled).toBe(true)
    expect(config.set('mode', 'c' as 'a')).toBe(false)
    expect(config.value.mode).toBe('a')
  })

  it('keeps the value object, so readers see changes', () => {
    const { config } = createConfig()
    const value = config.value
    config.set('mode', 'b')
    expect(value.mode).toBe('b')
  })

  it('does not share arrays with the caller', () => {
    const { config } = createConfig()
    const color: [number, number, number] = [4, 5, 6]
    config.set('color', color)
    color[0] = 9
    expect(config.value.color).toEqual([4, 5, 6])
    expect(schema.color.default).toEqual([1, 2, 3])
  })

  it('sets hidden values but never saves or loads them', () => {
    const hiddenSchema = defineConfig({
      exposure: number({ description: 'a runtime value', editable: true, hidden: true, default: 1 }),
    })
    const storage = memoryStorage()
    const config = new Config(hiddenSchema, { storageKey: 'test', storage })
    expect(config.set('exposure', 5)).toBe(true)
    config.save()
    expect(JSON.parse(storage.data.get('test')).values).toEqual({})
    storage.data.set('test', JSON.stringify({ version: 1, values: { exposure: 7 } }))
    config.load()
    expect(config.value.exposure).toBe(5)
  })

  it('saves only modified editable values and loads them back', () => {
    const { config, storage } = createConfig()
    config.set('maxLevel', 2)
    config.set('color', [0, 0, 0])
    config.save()
    expect(JSON.parse(storage.data.get('test'))).toEqual({ version: 1, values: { maxLevel: 2, color: [0, 0, 0] } })

    const { config: loaded } = createConfig(storage)
    loaded.load()
    expect(loaded.value.maxLevel).toBe(2)
    expect(loaded.value.color).toEqual([0, 0, 0])
    expect(loaded.value.mode).toBe('a')
  })

  it('ignores unknown, fixed and invalid stored values', () => {
    const storage = memoryStorage()
    storage.setItem(
      'test',
      JSON.stringify({ version: 1, values: { removed: 1, enabled: false, mode: 'x', maxLevel: 1 } }),
    )
    const { config } = createConfig(storage)
    config.load()
    expect(config.value).toMatchObject({ enabled: true, mode: 'a', maxLevel: 1 })
  })

  it('survives broken storage', () => {
    const storage = memoryStorage()
    storage.setItem('test', '{not json')
    const { config } = createConfig(storage)
    expect(() => config.load()).not.toThrow()
    const failing: ConfigStorage = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {},
    }
    const blocked = new Config(schema, { storageKey: 'test', storage: failing })
    expect(() => blocked.load()).not.toThrow()
    expect(() => blocked.save()).not.toThrow()
  })

  it('resets one or all properties and notifies listeners', () => {
    const { config } = createConfig()
    const changes: number[] = []
    const off = config.onChange('maxLevel', (value) => changes.push(value))
    config.set('maxLevel', 1)
    config.set('maxLevel', 1)
    config.set('mode', 'b')
    config.reset('maxLevel')
    expect(changes).toEqual([1, 5])
    expect(config.value.mode).toBe('b')
    config.reset()
    expect(config.value.mode).toBe('a')
    off()
    config.set('maxLevel', 0)
    expect(changes).toEqual([1, 5])
  })
})
