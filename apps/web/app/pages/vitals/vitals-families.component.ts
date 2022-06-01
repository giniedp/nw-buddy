import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'nwb-vitals-families',
  templateUrl: './vitals-families.component.html',
  styleUrls: ['./vitals-families.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VitalsFamiliesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
