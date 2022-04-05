import { HttpClientModule } from '@angular/common/http'
import { moduleMetadata, Meta, Story } from '@storybook/angular'

import { GsTableComponent } from './gs-table.component'
import { GsTableModule } from './gs-table.module'

export default {
  component: GsTableComponent,
  decorators: [
    moduleMetadata({
      imports: [GsTableModule, HttpClientModule],
    }),
  ],
  title: 'GsTable',
} as Meta

const Template: Story = (args) => ({
  styles: [
    `
    nwb-gs-table {
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
