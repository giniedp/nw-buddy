import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'
import { VitalDamageTableComponent } from './vital-damage-table.component'
import { DialogModule } from '@angular/cdk/dialog'

export default {
  title: 'Widgets / nwb-vitals-damage-table',
  component: VitalDamageTableComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule), importProvidersFrom(DialogModule)],

    }),
    moduleMetadata({
      imports: [VitalDamageTableComponent],
    }),
  ],
  ...storyControls<VitalDamageTableComponent>((arg) => {
    arg.select('vitalId', {
      defaultValue: 'Isabella_DG_Ebonscale_00',
      options: ['Isabella_DG_Ebonscale_00'],
    })
  }),
} satisfies Meta<VitalDamageTableComponent>

export const Example: StoryObj<VitalDamageTableComponent> = {}
