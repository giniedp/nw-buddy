import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { Meta, moduleMetadata, Story } from '@storybook/angular'
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

const StoryMeta: Meta = {
  title: 'Item Detail',
  component: StoryComponent,
  decorators: [
    moduleMetadata({
      imports: [AppTestingModule, ItemDetailModule, ItemFrameModule],
    }),
  ],
}

export default StoryMeta
export const ItemDetail: Story = () => ({
  props: {
    itemId: '1hLongsword_PromiseofPowerT5',
  },
})
