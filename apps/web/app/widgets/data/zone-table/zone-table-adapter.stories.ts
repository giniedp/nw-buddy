import { CommonModule } from '@angular/common'
import { Component, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { provideDataView } from '~/ui/data/data-view'
import { DataGridModule } from '~/ui/data/table-grid'
import { QuicksearchModule } from '~/ui/quicksearch'
import { ZoneTableAdapter } from './zone-table-adapter'

@Component({
  standalone: true,
  selector: 'nwb-story',
  template: `
    <div class="flex flex-col h-[100dvh] w-full">
      <ul class="menu menu-horizontal w-full flex-nowrap flex-1 overflow-x-auto scrollbar-hide">
        <span class="flex-1"></span>
        <li>
          <button [nwbGridPanelButton]="grid.ready$ | async" class="btn btn-square btn-ghost"></button>
        </li>
      </ul>
      <div class="flex-none p-2 w-full md:max-w-[256px]">
        <nwb-quicksearch-input [autofocus]="true" [placeholder]="'Quickfilter'"></nwb-quicksearch-input>
      </div>
      <nwb-table-grid [filterQueryParam]="'filter'" [persistKey]="'items-table'" #grid></nwb-table-grid>
    </div>
  `,
  imports: [CommonModule, DataGridModule, QuicksearchModule],
  providers: [
    provideDataView({
      adapter: ZoneTableAdapter,
    }),
  ],
})
export class StoryComponent {}

export default {
  title: 'Widgets / nwb-poi-grid',
  component: StoryComponent,
  //tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [StoryComponent],
    }),
  ],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<StoryComponent>

export const Example: StoryObj<StoryComponent> = {}
