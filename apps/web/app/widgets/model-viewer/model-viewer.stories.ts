import { ChangeDetectorRef, Component, Injector, importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { of, take } from 'rxjs'
import { CommonModule } from '@angular/common'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { ItemTableAdapter } from '~/widgets/data/item-table'
import { NwModule } from '~/nw'
import { ModelViewerModule } from './model-viewer.module'
import { ModelViewerService } from './model-viewer.service'
import { LayoutModule } from '~/ui/layout'

@Component({
  standalone: true,
  selector: 'nwb-story',
  template: ` <nwb-model-viewer [models]="models | async"></nwb-model-viewer> `,
  imports: [CommonModule, NwModule, ModelViewerModule, LayoutModule],
})
export class StoryComponent {
  public models = this.service.byMountId(of('Mount_MTX_1_horse'))

  public constructor(private service: ModelViewerService) {}
}

export default {
  title: 'Widgets / nwb-model-viewer',
  component: StoryComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule, DialogModule, NwModule)],
    }),
    moduleMetadata({
      imports: [StoryComponent],
    }),
  ],
} satisfies Meta<StoryComponent>

export const Example: StoryObj<StoryComponent> = {}
