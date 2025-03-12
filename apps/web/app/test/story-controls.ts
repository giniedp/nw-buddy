import { ArgTypes } from '@storybook/angular'

export type ArgType = ArgTypes['args'] extends infer T ? T : never
export interface CommonArgType<T> extends ArgType {
  defaultValue?: T
  value?: T
}

export interface NumberArgType<T> extends ArgType {
  defaultValue?: T
  min?: number
  max?: number
  step?: number
}

export type EnumArgType<T> =
  | ArgType
  | {
      defaultValue?: T
      options: Array<T> | Array<{ label: string; value: T }> | Record<string, T>
    }

function convertOptions<T>(
  options: Array<T> | Array<{ label: string; value: T }> | Record<string, T>,
): Array<{ label: string; value: T }> {
  if (!options) {
    return []
  }
  if (!Array.isArray(options)) {
    return Object.entries(options).map(([label, value]) => ({ label, value }))
  }
  return options.map((it: any) => {
    if (typeof it === 'string' || typeof it === 'number' || typeof it === 'boolean') {
      return {
        label: String(it),
        value: it,
      }
    }
    return it
  })
}

function buildSelectType(key: string, type: string, options: EnumArgType<any>) {
  const opts = convertOptions(options.options)
  const mapping = opts.reduce((res, it) => {
    res[it.label] = it.value
    return res
  }, {})
  const labels = opts.map((it) => it.label)
  return {
    control: {
      type: type,
    },
    name: key,
    defaultValue: labels[0],
    ...options,
    options: labels,
    mapping: mapping,
  }
}

export class StoryControlsBuilder<TArgs> {
  public static build<TArgs>(fn: (builder: StoryControlsBuilder<TArgs>) => unknown) {
    const b = new StoryControlsBuilder<TArgs>()
    fn(b)
    return b.build()
  }

  private types: Partial<ArgTypes<TArgs>> = {}

  public add(key: keyof TArgs, arg: ArgType) {
    this.types[key] = arg
    return this
  }

  public boolean<K extends keyof TArgs>(key: keyof TArgs, options: CommonArgType<TArgs[K]> = {}) {
    return this.add(key, {
      control: { type: 'boolean' },
      name: String(key),
      defaultValue: false,
      ...options,
    })
  }
  public text<K extends keyof TArgs>(key: keyof TArgs, options: CommonArgType<TArgs[K]> = {}) {
    return this.add(key, {
      control: { type: 'text' },
      name: String(key),
      defaultValue: '',
      ...options,
    })
  }
  public number<K extends keyof TArgs>(key: keyof TArgs, options: NumberArgType<TArgs[K]> = {}) {
    return this.add(key, {
      control: { type: 'number' },
      name: String(key),
      defaultValue: null,
      ...options,
    })
  }
  public range<K extends keyof TArgs>(key: keyof TArgs, options: NumberArgType<TArgs[K]> = {}) {
    return this.add(key, {
      control: { type: 'range' },
      name: String(key),
      defaultValue: null,
      ...options,
    })
  }
  public date<K extends keyof TArgs>(key: keyof TArgs, options: CommonArgType<TArgs[K]> = {}) {
    return this.add(key, {
      control: { type: 'date' },
      name: String(key),
      defaultValue: null,
      ...options,
    })
  }
  public color<K extends keyof TArgs>(key: keyof TArgs, presetColors: string[]) {
    return this.add(key, {
      control: { type: 'color', presetColors },
      name: String(key),
      defaultValue: null,
    })
  }
  public object<K extends keyof TArgs>(key: keyof TArgs, options: CommonArgType<TArgs[K]> = {}) {
    return this.add(key, {
      control: { type: 'object' },
      name: String(key),
      defaultValue: {},
      ...options,
    })
  }
  public array<K extends keyof TArgs>(key: keyof TArgs, options: CommonArgType<TArgs[K]> = {}) {
    return this.add(key, {
      control: { type: 'object' },
      name: String(key),
      defaultValue: [],
      ...options,
    })
  }
  public file(key: keyof TArgs, options: { accept?: string } = {}) {
    return this.add(key, {
      control: { type: 'file' },
      ...options,
    })
  }
  public radio<K extends keyof TArgs>(key: K, options: EnumArgType<TArgs[K]>) {
    return this.add(key, buildSelectType(key as string, 'radio', options) as any)
  }
  public radioInline = <K extends keyof TArgs>(key: K, options: EnumArgType<TArgs[K]>) => {
    return this.add(key, buildSelectType(key as string, 'inline-radio', options) as any)
  }
  public check = <K extends keyof TArgs>(key: K, options: EnumArgType<TArgs[K]>) => {
    return this.add(key, buildSelectType(key as string, 'check', options) as any)
  }
  public checkInline = <K extends keyof TArgs>(key: K, options: EnumArgType<TArgs[K]>) => {
    return this.add(key, buildSelectType(key as string, 'inline-check', options) as any)
  }
  public select = <K extends keyof TArgs>(key: K, options: EnumArgType<TArgs[K]>) => {
    return this.add(key, buildSelectType(key as string, 'select', options) as any)
  }
  public selectMulti = <K extends keyof TArgs>(key: K, options: EnumArgType<TArgs[K]>) => {
    return this.add(key, buildSelectType(key as string, 'multi-select', options) as any)
  }
  public append = (fn: (b: StoryControlsBuilder<TArgs>) => void) => {
    fn(this)
  }
  public as = <R>() => this as any as StoryControlsBuilder<R>
  public build = () => this.types
}
