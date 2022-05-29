import { Component, ChangeDetectionStrategy, Input, OnChanges, ChangeDetectorRef } from '@angular/core'
import { Perkbuckets, Perks } from '@nw-data/types'

@Component({
  selector: 'nwb-item-detail-perks',
  templateUrl: './item-detail-perks.component.html',
  styleUrls: ['./item-detail-perks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col gap-2'
  }
})
export class ItemDetailPerksComponent implements OnChanges {
  @Input()
  public perks: Perks[]

  @Input()
  public buckets: Perkbuckets[]

  @Input()
  public gearScore: number = 600

  public constructor(private cdRef: ChangeDetectorRef) {}

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }
}
