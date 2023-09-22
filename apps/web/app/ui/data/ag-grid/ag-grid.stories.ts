import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { AgGridComponent } from './ag-grid.component'
import { AgGridModule } from './ag-grid.module'

export default {
  title: 'UI / nwb-ag-grid',
  component: AgGridComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [AgGridModule],
    }),
  ],
  args: {
    minHeight: 200
  }
} satisfies Meta<AgGridComponent>

export const Example: StoryObj<AgGridComponent> = {
  args: {
    data: Array.from({ length: 10 }, () => {
      return {
        id: Math.random(),
        name: Math.random().toString(36).substring(7),
      }
    }),
    options: {
      columnDefs: [{ field: 'id' }, { field: 'name' }],
    },
  },
}
