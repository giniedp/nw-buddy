import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'nwb-vitals-families',
  templateUrl: './vitals-families.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'layout-content'
  }
})
export class VitalsFamiliesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
