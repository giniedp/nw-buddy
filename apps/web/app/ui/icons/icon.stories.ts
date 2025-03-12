import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { SvgIconComponent } from './icon.component'
import { IconsModule } from './icons.module'
import { svgBars } from './svg'

export default {
  title: 'UI / nwb-icon',
  component: SvgIconComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [IconsModule],
    }),
  ],
  args: {
    width: 32,
    height: 32,
  },
} satisfies Meta<SvgIconComponent>

export const Example: StoryObj<SvgIconComponent> = {
  args: {
    icon: svgBars,
  },
}
