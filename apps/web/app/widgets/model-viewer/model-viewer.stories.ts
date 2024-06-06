import { CommonModule } from '@angular/common'
import { Component, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { of } from 'rxjs'
import { NwModule } from '~/nw'
import { AppTestingModule } from '~/test'
import { LayoutModule } from '~/ui/layout'
import { ModelViewerModule } from './model-viewer.module'
import { ModelsService } from './model-viewer.service'

@Component({
  standalone: true,
  selector: 'nwb-story',
  template: ` <nwb-model-viewer [models]="models | async"></nwb-model-viewer> `,
  imports: [CommonModule, NwModule, ModelViewerModule, LayoutModule],
})
export class StoryComponent {
  public models = this.service.byMountId(of('Mount_MTX_1_horse'))

  public constructor(private service: ModelsService) {}
}

export default {
  title: 'Widgets / nwb-model-viewer',
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
