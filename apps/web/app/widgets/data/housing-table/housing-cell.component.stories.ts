import { CommonModule } from '@angular/common'
import { Component, importProvidersFrom } from '@angular/core'
import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular'
import { defer } from 'rxjs'
import { injectNwData } from '~/data'
import { AppTestingModule } from '~/test'
import { VirtualGridComponent } from '~/ui/data/virtual-grid'
import { VirtualGridCellDirective } from '~/ui/data/virtual-grid/virtual-grid-cell.directive'
import { HousingCellComponent } from './housing-cell.component'

@Component({
  standalone: true,
  template: ` <nwb-virtual-grid [options]="gridOptions" [data]="items$ | async"></nwb-virtual-grid> `,
  imports: [CommonModule, VirtualGridComponent, VirtualGridCellDirective, HousingCellComponent],
  host: {
    class: 'flex flex-col h-[800px] w-full',
  },
})
export class StoryComponent {
  protected items$ = defer(() => injectNwData().housingItemsAll())
  protected gridOptions = HousingCellComponent.buildGridOptions()
}

export default {
  title: 'Widgets / nwb-virtual-grid / Housing',
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
  args: {},
} satisfies Meta<StoryComponent>

export const Example: StoryObj<StoryComponent> = {}
