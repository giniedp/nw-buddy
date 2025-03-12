import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { CodeEditorComponent } from './code-editor.component'
import { CodeEditorModule } from './code-editor.module'
import { storyControls } from '~/test/story-utils'

export default {
  title: 'UI / nwb-code-editor',
  component: CodeEditorComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [CodeEditorModule],
    }),
  ],
  args: {
    minHeight: 200,
  },
} satisfies Meta<CodeEditorComponent>

export const Example: StoryObj<CodeEditorComponent> = {}
