import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'nwb-not-found',
  templateUrl: './not-found.component.html',
  host: {
    class: 'layout-col items-center justify-center',
  },
  standalone: false,
})
export class NotFoundComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
