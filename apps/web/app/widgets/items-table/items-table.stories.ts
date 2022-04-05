import { HttpClientModule } from '@angular/common/http'
import { moduleMetadata, Meta, Story } from '@storybook/angular'
import { LocaleService } from '~/core/i18n'
import { NwModule } from '~/core/nw'

import { ItemsTableComponent } from './items-table.component'
import { ItemsTableModule } from './items-table.module'

export default {
  component: ItemsTableComponent,
  decorators: [
    moduleMetadata({
      imports: [NwModule.forRoot(), ItemsTableModule, HttpClientModule],
      providers: [
        LocaleService.withLocale('en-us'),
      ]
    }),
  ],
  title: 'ItemsTable',
} as Meta

const Template: Story = (args) => ({
  styles: [
    `
    nwb-items-table {
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
