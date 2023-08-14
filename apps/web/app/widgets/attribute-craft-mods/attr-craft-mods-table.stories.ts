import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'

import { AttributeCraftModsComponent as StoryComponent } from './attr-craft-mods-table.component'
import { AttributeCraftModsModule as StoryModule } from './attr-craft-mods.module'

export default {
  title: 'Widgets / nwb-attribute-craft-mods',
  component: StoryComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [StoryModule],
    }),
  ],
} satisfies Meta<StoryComponent>

export const Example: StoryObj<StoryComponent> = {}
