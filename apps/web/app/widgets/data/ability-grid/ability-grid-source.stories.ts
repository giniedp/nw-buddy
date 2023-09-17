import { CommonModule } from '@angular/common'
import { Component, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { DataGridModule, provideGrid } from '~/ui/data-grid'
import { AbilityGridSource } from './ability-grid-source'
import { QuicksearchModule } from '~/ui/quicksearch'

@Component({
  standalone: true,
  selector: 'nwb-story',
  template: `
    <div class="flex flex-col h-[100dvh] w-full">
      <ul class="menu menu-horizontal w-full flex-nowrap flex-1 overflow-x-auto scrollbar-hide">
        <li>
          <button
            [nwbGridCateogryMenu]="grid.categories$ | async"
            [defaultRoute]="'all'"
            [defaultTitle]="'Items'"
            [routePrefix]="'..'"
            [rowCounter]="grid.rowCount$ | async"
            class="btn btn-ghost normal-case text-left"
          ></button>
        </li>
        <span class="flex-1"></span>
        <li>
          <button [nwbGridPanelButton]="grid.ready$ | async" class="btn btn-square btn-ghost"></button>
        </li>
      </ul>
      <div class="flex-none p-2 w-full md:max-w-[300px]">
        <nwb-quicksearch-input
          [nwbGridQuickfilter]="grid.ready$ | async"
          [placeholder]="'Quickfilter'"
        ></nwb-quicksearch-input>
      </div>
      <nwb-data-grid [filterParam]="'filter'" [persistKey]="'items-table'" #grid></nwb-data-grid>
    </div>
  `,
  imports: [CommonModule, DataGridModule, QuicksearchModule],
  providers: [
    provideGrid({
      source: AbilityGridSource,
    }),
  ],
})
export class StoryComponent {}

export default {
  title: 'Widgets / nwb-abilities-table',
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
