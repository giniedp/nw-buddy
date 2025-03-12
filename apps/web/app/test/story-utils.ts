import { Meta, StoryObj } from '@storybook/angular'
import { StoryControlsBuilder } from './story-controls'

export function storyControls<TArgs>(fn: (b: StoryControlsBuilder<TArgs>) => unknown): Pick<Meta, 'argTypes' | 'args'> {
  const argTypes = StoryControlsBuilder.build(fn)
  const args = Object.fromEntries(
    Object.entries(argTypes).map(([key, spec]) => {
      return [key, (spec as any).defaultValue]
    }),
  )
  return {
    argTypes,
    args,
  }
}

export function storyNoControls(): Pick<Meta, 'parameters'> {
  return {
    parameters: {
      controls: { hideNoControlsWarning: true },
    },
  }
}

export function storyProps<T>(fn: () => ArgsOf<T>) {
  return fn()
}

export function storyExample<T, TArgs = ArgsOf<T>>(fn: (arg: TArgs) => ArgsOf<T>): StoryObj<TArgs> {
  return {
    render: (arg) => {
      return {
        props: fn(arg as any),
      }
    },
  }
}

export type ArgsOf<T> = Partial<{
  [P in keyof T]: T[P]
}>
