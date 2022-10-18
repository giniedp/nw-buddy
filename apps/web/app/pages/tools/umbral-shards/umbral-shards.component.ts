import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NwModule } from '~/nw';
import { UmbralshardsModule } from '~/widgets/umbralshards';

@Component({
  standalone: true,
  selector: 'nwb-umbral-shards-page',
  templateUrl: './umbral-shards.component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
   imports: [CommonModule, RouterModule, NwModule, UmbralshardsModule],
   host: {
    class: 'layout-content layout-pad'
  }
})
export class UmbralShardsComponent {

  public tab = 0

}
