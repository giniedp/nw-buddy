import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { Perks } from '@nw-data/types';

@Component({
  selector: 'nwb-item-perks',
  templateUrl: './item-perks.component.html',
  styleUrls: ['./item-perks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemPerksComponent implements OnInit {

  @Input()
  public perks: Perks[]

  @Input()
  public gearScore: number

  public constructor() { }

  public ngOnInit(): void {
  }

}
