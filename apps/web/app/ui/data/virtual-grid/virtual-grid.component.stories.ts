import { CommonModule } from '@angular/common'
import { Component, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { VirtualGridComponent } from './virtual-grid.component'
import { VirtualGridCellDirective } from './virtual-grid-cell.directive'

@Component({
  standalone: true,
  template: `
    <nwb-virtual-grid [itemHeight]="100" [itemWidth]="200" [gridClass]="['-mx-2']">
      <header class="h-60 bg-base-100 ">Header</header>
      <div *nwbVirtualGridCell="items; let item" class="rounded-md bg-base-100 m-2 ">
        {{ item?.text }}
      </div>
      <footer class="h-60 bg-base-100">Footer</footer>
    </nwb-virtual-grid>
  `,
  imports: [CommonModule, VirtualGridComponent, VirtualGridCellDirective],
  host: {
    class: 'flex flex-col h-[300px] w-full',
  },
})
export class StoryComponent {
  public items = Array.from({ length: 10000 }).map((_, i) => {
    return {
      text: `Cell ${i}`,
    }
  })
}

export default {
  title: 'UI / nwb-virtual-grid',
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
