import { Component, ChangeDetectionStrategy, Input, OnChanges, ChangeDetectorRef } from '@angular/core'
import { ItemDetailService } from './item-detail.service'

@Component({
  selector: 'nwb-item-detail-perks',
  templateUrl: './item-detail-perks.component.html',
  styleUrls: ['./item-detail-perks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailPerksComponent {

  public get perks() {
    return this.service.perks$
  }

  public get buckets() {
    return this.service.perkBuckets$
  }

  @Input()
  public gearScore: number = 600

  public constructor(private service: ItemDetailService) {}
}
