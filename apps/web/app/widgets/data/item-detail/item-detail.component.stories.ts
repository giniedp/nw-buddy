import { importProvidersFrom } from '@angular/core'
import { Meta, StoryObj, applicationConfig, moduleMetadata } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { storyControls } from '~/test/story-utils'
import { ItemDetailComponent } from './item-detail.component'
import { ItemDetailModule } from './item-detail.module'

export default {
  title: 'Widgets / nwb-item-detail',
  component: ItemDetailComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)],
    }),
    moduleMetadata({
      imports: [ItemDetailModule],
    }),
  ],
  ...storyControls<ItemDetailComponent>((arg) => {
    arg.text('itemId', {
      defaultValue: 'HeavyChest_HugoT5',
    })
  }),
  render: (arg) => {
    return {
      template: `
      <nwb-item-detail [itemId]="'${arg.itemId}'" #detail="detail">
        <nwb-item-detail-header/>
        <div *ngIf="!(detail.isLoading$ | async)" class="p-4">
          <nwb-item-detail-stats></nwb-item-detail-stats>
          <nwb-item-divider class="my-3"></nwb-item-divider>
          <nwb-item-detail-perks></nwb-item-detail-perks>
          <nwb-item-divider class="my-3"></nwb-item-divider>
          <nwb-item-detail-description> </nwb-item-detail-description>
          <nwb-item-divider class="my-3"></nwb-item-divider>
          <nwb-item-detail-info> </nwb-item-detail-info>
        </div>
      </nwb-item-detail>
      `,
    }
  },
} satisfies Meta<ItemDetailComponent>

export const Example: StoryObj = {}
