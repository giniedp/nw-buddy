import { Component, OnInit } from '@angular/core';
import { TradeskillsService } from '~/widgets/tradeskills';

@Component({
  selector: 'nwb-progression',
  templateUrl: './progression.component.html',
  styleUrls: ['./progression.component.scss'],
  host: {
    class: 'nwb-page has-menu',
  },
})
export class ProgressionComponent implements OnInit {

  public constructor(public tradeskill: TradeskillsService) {

  }

  public ngOnInit(): void {
  }

}
