import { Type } from '@angular/core'
import { Meta, moduleMetadata, Story, StoryFn } from '@storybook/angular'
import { StoryFnAngularReturnType } from '@storybook/angular/dist/ts3.9/client/preview/types'
import type { ArgType } from '@storybook/api'
import { StoryAnnotations } from '@storybook/csf'

export interface CommonArgType<T> extends ArgType {
  defaultValue?: T
}

export interface NumberArgType<T> extends ArgType {
  defaultValue?: T
  min?: number
  max?: number
  step?: number
}

export interface EnumArgType<T> extends ArgType {
  defaultValue?: T
  options: Array<T> | Array<{ label: string; value: T }> | Record<string, T>
}

function convertOptions<T>(
  options: Array<T> | Array<{ label: string; value: T }> | Record<string, T>
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

export class ArgTypesBuilder<T> {
  private types: any = {}

  public boolean = <K extends keyof T>(key: keyof T, options: CommonArgType<T[K]> = {}) => {
    this.types[key] = {
      control: { type: 'boolean' },
      name: key,
      defaultValue: false,
      ...options,
    }
    return this
  }
  public text = <K extends keyof T>(key: keyof T, options: CommonArgType<T[K]> = {}) => {
    this.types[key] = {
      control: { type: 'text' },
      name: key,
      defaultValue: '',
      ...options,
    }
    return this
  }
  public number = <K extends keyof T>(key: keyof T, options: NumberArgType<T[K]> = {}) => {
    this.types[key] = {
      control: { type: 'number' },
      name: key,
      defaultValue: null,
      ...options,
    }
    return this
  }
  public range = <K extends keyof T>(key: keyof T, options: NumberArgType<T[K]> = {}) => {
    this.types[key] = {
      control: { type: 'range' },
      name: key,
      defaultValue: null,
      ...options,
    }
    return this
  }
  public date = <K extends keyof T>(key: keyof T, options: CommonArgType<T[K]> = {}) => {
    this.types[key] = {
      control: { type: 'date' },
      name: key,
      defaultValue: null,
      ...options,
    }
    return this
  }
  public color = <K extends keyof T>(key: keyof T, presetColors: string[]) => {
    this.types[key] = { control: { type: 'color', presetColors } }
    return this
  }
  public object = <K extends keyof T>(key: keyof T, options: CommonArgType<T[K]> = {}) => {
    this.types[key] = {
      control: { type: 'object' },
      name: key,
      defaultValue: {},
      ...options,
    }
    return this
  }
  public array = <K extends keyof T>(key: keyof T, options: CommonArgType<T[K]> = {}) => {
    this.types[key] = {
      control: { type: 'object' },
      name: key,
      defaultValue: [],
      ...options,
    }
    return this
  }
  public file = (key: keyof T, options: { accept?: string } = {}) => {
    this.types[key] = {
      control: { type: 'file' },
      ...options,
    }
    return this
  }
  public radio = <K extends keyof T>(key: K, options: EnumArgType<T[K]>) => {
    this.types[key] = buildSelectType(key as string, 'radio', options)
    return this
  }
  public radioInline = <K extends keyof T>(key: K, options: EnumArgType<T[K]>) => {
    this.types[key] = buildSelectType(key as string, 'inline-radio', options)
    return this
  }
  public check = <K extends keyof T>(key: K, options: EnumArgType<T[K]>) => {
    this.types[key] = buildSelectType(key as string, 'check', options)
    return this
  }
  public checkInline = <K extends keyof T>(key: K, options: EnumArgType<T[K]>) => {
    this.types[key] = buildSelectType(key as string, 'inline-check', options)
    return this
  }
  public select = <K extends keyof T>(key: K, options: EnumArgType<T[K]>) => {
    this.types[key] = buildSelectType(key as string, 'select', options)
    return this
  }
  public selectMulti = <K extends keyof T>(key: K, options: EnumArgType<T[K]>) => {
    this.types[key] = buildSelectType(key as string, 'multi-select', options)
    return this
  }
  public append = (fn: (b: ArgTypesBuilder<T>) => void) => {
    fn(this)
  }
  public as = <R>() => this as any as ArgTypesBuilder<R>
  public build = () => this.types
}

export interface CreateStoryOptions<Args, T> extends Meta {
  component: Type<T>
  controls?: (b: ArgTypesBuilder<Args>) => void
  module?: Parameters<typeof moduleMetadata>[0]
}

// export function createStory<T>(
//   options: CreateStoryOptions<Partial<T>, T>
// ): Meta & { example: typeof createExample<Partial<T>, T> }
export function createStory<Args, T>(
  options: CreateStoryOptions<Args, T>
): Meta & { example: typeof createExample<Args, T> } {
  if (options.module) {
    options.decorators = options.decorators || []
    options.decorators.push(moduleMetadata(options.module))
    delete options.module
  }
  if (options.controls) {
    const b = new ArgTypesBuilder<Args>()
    options.controls(b)
    options.argTypes = b.build()
    delete options.controls
  }
  if (!options.parameters) {
    options.parameters = {
      controls: { hideNoControlsWarning: true },
    }
  }
  return {
    ...options,
    example: createExample,
  }
}

export function createExample<Args, T>(
  storyFn: (args: Args) => { props?: Partial<T> } & StoryFnAngularReturnType
): Story<Args> & { extend: (extension: StoryAnnotations<any, Args>) => Story<Args> } {
  const result = storyFn.bind({})
  result.extend = (annotations: StoryAnnotations<any, Args>): Story<Args> => {
    const result: StoryFn<Args> = storyFn.bind({})
    Object.assign(result, annotations)
    return result
  }
  return result
}
