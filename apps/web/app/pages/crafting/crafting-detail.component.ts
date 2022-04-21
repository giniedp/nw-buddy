import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'nwb-crafting-detail',
  templateUrl: './crafting-detail.component.html',
  styleUrls: ['./crafting-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CraftingDetailComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
