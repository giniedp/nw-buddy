import { Component, OnInit, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Perks } from '@nw-data/types';

@Component({
  selector: 'nwb-item-detail-perks',
  templateUrl: './item-detail-perks.component.html',
  styleUrls: ['./item-detail-perks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemDetailPerksComponent implements OnInit, OnChanges {

  @Input()
  public perks: Perks[]

  @Input()
  public gearScore: number

  public constructor(private cdRef: ChangeDetectorRef) { }

  public ngOnInit(): void {
  }

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }
}
