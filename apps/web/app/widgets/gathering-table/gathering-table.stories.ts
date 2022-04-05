import { HttpClientModule } from '@angular/common/http'
import { moduleMetadata, Meta, Story } from '@storybook/angular'

import { GatheringTableComponent } from './gathering-table.component'
import { GatheringTableModule } from './gathering-table.module'

export default {
  component: GatheringTableComponent,
  decorators: [
    moduleMetadata({
      imports: [GatheringTableModule, HttpClientModule],
    }),
  ],
  title: 'Gathering Table',
} as Meta

const Template: Story = (args) => ({
  props: {
    ...args,
  },
})

export const Default = Template.bind({})
Default.args = {
  // task: {
  //   id: '1',
  //   title: 'Test Task',
  //   state: 'TASK_INBOX',
  //   updatedAt: new Date(2021, 0, 1, 9, 0),
  // },
}
