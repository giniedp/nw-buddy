import { Component, ChangeDetectionStrategy } from '@angular/core'
import { DestroyService } from '~/core/utils'
import { ItemDetailService } from './item-detail.service'

@Component({
  selector: 'nwb-item-detail-description',
  host: {
    class: 'contents'
  },
  template: `
    <ng-container *ngIf="description | async">
      <p class="text-primary italic" [nwText]="description | async" [itemId]="itemId | async"></p>
    </ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService],
})
export class ItemDetailDescriptionComponent {
  public get item() {
    return this.service.entity$
  }

  public get itemId() {
    return this.service.entityid$
  }

  public get description() {
    return this.service.description$
  }

  public constructor(private service: ItemDetailService) {
    //
  }
}
