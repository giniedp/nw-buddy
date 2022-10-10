import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { Meta, moduleMetadata, Story } from '@storybook/angular'
import { AppTestingModule } from '~/test'
import { ItemDetailModule } from './item-detail.module'

@Component({
  imports: [CommonModule, ItemDetailModule],
  template: `
    <nwb-item-detail [entityId]="'1htowershieldcastt5'" #detail="detail">
      <nwb-item-detail-header></nwb-item-detail-header>
      <ng-container *ngIf="!(detail.isLoading$ | async)">
        <nwb-item-detail-stats></nwb-item-detail-stats>
        <hr class="item-detail-divider" />
        <nwb-item-detail-perks></nwb-item-detail-perks>
        <hr class="item-detail-divider" />
        <nwb-item-detail-description> </nwb-item-detail-description>
        <hr class="item-detail-divider" />
        <nwb-item-detail-info> </nwb-item-detail-info>
      </ng-container>
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
      imports: [AppTestingModule, ItemDetailModule],
    }),
  ],
}

export default StoryMeta
export const ItemDetail: Story = () => ({
  props: {
    itemId: '1hLongsword_PromiseofPowerT5',
  },
})
