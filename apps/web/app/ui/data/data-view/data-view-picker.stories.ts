import { CommonModule } from '@angular/common'
import { ChangeDetectorRef, Component, Injector, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { NwModule } from '~/nw'
import { AppTestingModule } from '~/test'
import { ItemTableAdapter } from '~/widgets/data/item-table'
import { DataViewPicker } from './data-view-picker.component'
import { DataViewModule } from './data-view.module'
import { DataViewMode } from './data-view.service'

@Component({
  standalone: true,
  selector: 'nwb-story',
  template: `
    <button class="btn" (click)="pickItem()">Pick</button>
    <button class="btn" (click)="pickItem('table')">Pick (grid mode)</button>
    <button class="btn" (click)="pickItem('grid')">Pick (virtual mode)</button>
    <div>Picked Item: {{ result | json }}</div>
  `,
  imports: [CommonModule, NwModule, DataViewModule],
})
export class StoryComponent {
  public result: any

  public constructor(
    private injector: Injector,
    private cdRef: ChangeDetectorRef,
  ) {
    //
  }
  public pickItem(mode: DataViewMode = null) {
    DataViewPicker.open({
      injector: this.injector,
      title: 'Pick Item',
      selection: this.result,
      displayMode: mode ? [mode] : null,
      dataView: {
        adapter: ItemTableAdapter,
      },
    }).then((result) => {
      this.result = result
    })
  }
}

export default {
  title: 'UI / nwb-data-view-picker',
  component: StoryComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule, NwModule)],
    }),
    moduleMetadata({
      imports: [StoryComponent],
    }),
  ],
} satisfies Meta<StoryComponent>

export const Example: StoryObj<StoryComponent> = {}
