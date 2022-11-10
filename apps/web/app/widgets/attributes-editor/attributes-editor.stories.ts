import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { Meta, moduleMetadata, Story } from '@storybook/angular'
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

const StoryMeta: Meta = {
  title: 'Attributes Editor',
  component: StoryComponent,
  decorators: [
    moduleMetadata({
      imports: [AppTestingModule, AttributesEditorModule],
    }),
  ],
}

export default StoryMeta
export const AttributesEditor: Story = () => ({
  props: {

  },
})
