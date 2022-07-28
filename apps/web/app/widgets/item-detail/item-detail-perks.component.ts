import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { Perkbuckets, Perks } from '@nw-data/types'

@Component({
  selector: 'nwb-item-detail-perks',
  templateUrl: './item-detail-perks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col gap-2'
  }
})
export class ItemDetailPerksComponent {

  @Input()
  public perks: Perks[]

  @Input()
  public buckets: Perkbuckets[]

  @Input()
  public gearScore: number = 600
}
