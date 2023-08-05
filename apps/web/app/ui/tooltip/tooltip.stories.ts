import { importProvidersFrom } from '@angular/core'
import { Meta, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'

import { TooltipDirective } from './tooltip.directive'
import { TooltipModule } from './tooltip.module'

type StoryArgs = Pick<TooltipDirective, 'tooltip' | 'color' | 'tooltipDelay' | 'tooltipOffset' | 'tooltipPlacement'>

export default {
  title: 'UI / [tooltip]',
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [TooltipModule],
    }),
  ],
  ...storyControls<StoryArgs>((b) => {
    b.text('tooltip', {
      defaultValue: 'Tooltip Text',
    })
    b.number('tooltipDelay')
    b.number('tooltipOffset')
    b.select('color', {
      options: ['primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'],
    })
    b.select('tooltipPlacement', {
      options: ['auto', 'top', 'right', 'bottom', 'left'],
    })
  }),
  render: (args) => {
    return {
      template: `
        <span
          class="m-4"
          [tooltip]='${JSON.stringify(args.tooltip)}'
          [color]='${JSON.stringify(args.color)}'
          [tooltipPlacement]='${JSON.stringify(args.tooltipPlacement)}'
          [tooltipDelay]='${JSON.stringify(args.tooltipDelay)}'
          [tooltipOffset]='${JSON.stringify(args.tooltipOffset)}'
        > hover over me </span>
      `,
    }
  },
} satisfies Meta<StoryArgs>

export const Example = {}
