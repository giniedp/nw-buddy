import { importProvidersFrom } from '@angular/core'
import { Meta, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'

import { TooltipDirective } from './tooltip.directive'
import { TooltipModule } from './tooltip.module'

type StoryArgs = Pick<
  TooltipDirective,
  'tooltip' | 'tooltipClass' | 'tooltipDelay' | 'tooltipOffset' | 'tooltipPlacement' | 'tooltipSticky'
>

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
    b.number('tooltipOffset', { defaultValue: 4 })
    b.boolean('tooltipSticky')
    b.select('tooltipPlacement', {
      options: [
        'auto',
        'top',
        'top-left',
        'top-right',
        'right',
        'right-top',
        'right-bottom',
        'bottom',
        'bottom-left',
        'bottom-right',
        'left',
        'left-top',
        'left-bottom',
      ],
    })
  }),
  render: (args) => {
    return {
      template: `
        <div
          class="w-60 bg-primary text-white aspect-square"
          [tooltip]='${JSON.stringify(args.tooltip)}'
          [tooltipClass]="'bg-primary text-white'"
          [tooltipSticky]='${JSON.stringify(args.tooltipSticky)}'
          [tooltipPlacement]='${JSON.stringify(args.tooltipPlacement)}'
          [tooltipDelay]='${JSON.stringify(args.tooltipDelay)}'
          [tooltipOffset]='${JSON.stringify(args.tooltipOffset)}'
        > This is a box with tooltip </div>
      `,
    }
  },
} satisfies Meta<StoryArgs>

export const Example = {}
