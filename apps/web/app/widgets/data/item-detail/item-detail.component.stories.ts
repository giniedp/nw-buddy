import { CommonModule } from '@angular/common'
import { Component, Input, importProvidersFrom } from '@angular/core'
import { applicationConfig, Meta, moduleMetadata, Story, StoryObj } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { ItemFrameModule } from '~/ui/item-frame'
import { ItemDetailModule } from './item-detail.module'

@Component({
  imports: [CommonModule, ItemDetailModule, ItemFrameModule],
  template: `
    <nwb-item-detail [entityId]="'1htowershieldcastt5'" #detail="detail">
      <nwb-item-detail-header></nwb-item-detail-header>
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
})
class StoryComponent {
  @Input()
  itemId: string
}

const meta: Meta = {
  title: 'Item Detail',
  component: StoryComponent,
  decorators: [
    applicationConfig({
      providers: [importProvidersFrom(AppTestingModule)]
    }),
    moduleMetadata({
      imports: [ItemDetailModule, ItemFrameModule],
    }),
  ],
}

export default meta
export const ItemDetail: StoryObj = {}
