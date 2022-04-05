import { HttpClientModule } from '@angular/common/http'
import { moduleMetadata, Meta, Story } from '@storybook/angular'

import { XpTableComponent } from './xp-table.component'
import { XpTableModule } from './xp-table.module'

export default {
  component: XpTableComponent,
  decorators: [
    moduleMetadata({
      imports: [XpTableModule, HttpClientModule],
    }),
  ],
  title: 'XpTable',
} as Meta

const Template: Story = (args) => ({
  styles: [
    `
    nwb-xp-table {
      height: calc(100vh - 2rem) ;
    }
    `,
  ],
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
