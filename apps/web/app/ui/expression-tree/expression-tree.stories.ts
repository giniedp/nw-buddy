import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'

import { ExpressionTreeEditorComponent } from './expression-tree-editor.component'

export default {
  title: 'Ui / nwb-expression-tree',
  component: ExpressionTreeEditorComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [ExpressionTreeEditorComponent],
    }),
  ],
  args: {},
} satisfies Meta<ExpressionTreeEditorComponent>

export const Example: StoryObj<ExpressionTreeEditorComponent> = {
  args: {
    knownFields: [
      { id: 'foo', label: 'Foo', isPath: false },
      { id: 'bar', label: 'Bar', isPath: false },
      { id: 'baz', label: 'Baz', isPath: false },
    ],
  },
}
