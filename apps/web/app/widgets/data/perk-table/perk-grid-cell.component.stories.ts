import { CommonModule } from '@angular/common'
import { Component, importProvidersFrom } from '@angular/core'
import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular'
import { defer } from 'rxjs'
import { injectNwData } from '~/data'
import { AppTestingModule } from '~/test'
import { VirtualGridComponent } from '~/ui/data/virtual-grid'
import { VirtualGridCellDirective } from '~/ui/data/virtual-grid/virtual-grid-cell.directive'
import { PerkGridCellComponent } from './perk-grid-cell.component'

@Component({
  standalone: true,
  template: ` <nwb-virtual-grid [options]="options" [data]="items$ | async"></nwb-virtual-grid> `,
  imports: [CommonModule, VirtualGridComponent, VirtualGridCellDirective, PerkGridCellComponent],
  host: {
    class: 'flex flex-col h-[800px] w-full',
  },
})
export class StoryComponent {
  protected items$ = defer(() => injectNwData().perksAll())
  protected options = PerkGridCellComponent.buildGridOptions()
}

export default {
  title: 'Widgets / nwb-virtual-grid / Perk',
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
