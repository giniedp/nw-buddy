import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { AttributesEditorComponent } from './attributes-editor.component'
import { AttributesEditorModule } from './attributes-editor.module'
import { storyControls } from '~/test/story-utils'
import { NW_MAX_CHARACTER_LEVEL } from '@nw-data/common'

export default {
  title: 'Widgets / nwb-attributes-editor',
  component: AttributesEditorComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [AttributesEditorModule],
    }),
  ],
  ...storyControls<AttributesEditorComponent>((arg) => {
    arg.number('level', {
      min: 1,
      max: NW_MAX_CHARACTER_LEVEL,
      defaultValue: NW_MAX_CHARACTER_LEVEL,
    })
    arg.boolean('freeMode')
  }),
} satisfies Meta<AttributesEditorComponent>

export const Example: StoryObj<AttributesEditorComponent> = {}
