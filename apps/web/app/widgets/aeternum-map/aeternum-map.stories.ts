import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'

import { storyControls } from '~/test/story-utils'
import { AeternumMapComponent } from './aeternum-map.component'
import { AeternumMapModule } from './aeternum-map.module'

export default {
  title: 'Widgets / nwb-aeternum-map',
  component: AeternumMapComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [AeternumMapModule],
    }),
  ],
  ...storyControls<AeternumMapComponent>((arg) => {}),
} satisfies Meta<AeternumMapComponent>

export const Example: StoryObj<AeternumMapComponent> = {}
