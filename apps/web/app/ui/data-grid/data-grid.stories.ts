import { Component, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { DataGridComponent } from './data-grid.component'
import { of } from 'rxjs'
import { CommonModule } from '@angular/common'
import { DataGridAdapter } from './data-table-source'

@Component({
  standalone: true,
  selector: 'nwb-story',
  template: `
    <div class="flex flex-col h-[100vh] w-[100vw]">
      <nwb-data-grid class="flex-1"></nwb-data-grid>
    </div>
  `,
  imports: [CommonModule, DataGridComponent],
})
export class StoryComponent implements DataGridAdapter<{ id: string; name: string }> {
  public entityID(it) {
    return it.id
  }
  public entityCategories() {
    return null
  }
  public connect() {
    return of(
      Array.from({ length: 10 }, () => {
        return {
          id: String(Math.random()),
          name: Math.random().toString(36).substring(7),
        }
      })
    )
  }

  public gridOptions() {
    return {
      columnDefs: [{ field: 'id' }, { field: 'name' }],
    }
  }
}

export default {
  title: 'UI / nwb-data-grid',
  component: StoryComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [StoryComponent],
    }),
  ],
} satisfies Meta<StoryComponent>

export const Example: StoryObj<StoryComponent> = {}
