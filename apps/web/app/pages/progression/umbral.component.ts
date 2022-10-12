import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'nwb-umbral',
  templateUrl: './umbral.component.html',
   // changeDetection: ChangeDetectionStrategy.OnPush
   host: {
    class: 'layout-content'
  }
})
export class UmbralComponent {

  public tab = 0

}
