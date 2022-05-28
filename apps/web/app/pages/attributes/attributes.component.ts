import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'nwb-attributes',
  templateUrl: './attributes.component.html',
  styleUrls: ['./attributes.component.scss'],
  host: {
    class: 'nwb-page',
  },
})
export class AttributesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
