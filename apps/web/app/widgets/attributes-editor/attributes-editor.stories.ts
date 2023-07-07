import { CommonModule } from '@angular/common'
import { Component, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { AttributesEditorModule } from './attributes-editor.module'


@Component({
  imports: [CommonModule, AttributesEditorModule],
  template: `
    <nwb-attributes-editor></nwb-attributes-editor>
  `,
})
class StoryComponent {

}

const meta: Meta = {
  title: 'Attributes Editor',
  component: StoryComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)]
    }),
    moduleMetadata({
      imports: [AttributesEditorModule],
    }),
  ],
}

export default meta
export const AttributesEditor: StoryObj = {}
