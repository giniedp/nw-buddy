import { Component, ChangeDetectionStrategy, Input, OnChanges, ChangeDetectorRef } from '@angular/core'
import { Perks } from '@nw-data/types'

@Component({
  selector: 'nwb-item-detail-perks',
  templateUrl: './item-detail-perks.component.html',
  styleUrls: ['./item-detail-perks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemDetailPerksComponent implements OnChanges {
  @Input()
  public perks: Perks[]

  @Input()
  public gearScore: number = 600

  public constructor(private cdRef: ChangeDetectorRef) {}

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }
}
