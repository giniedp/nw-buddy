import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NwModule } from '~/nw';
import { LayoutModule } from '~/ui/layout';
import { UmbralshardsModule } from '~/widgets/umbralshards';

@Component({
  standalone: true,
  selector: 'nwb-umbral-shards-page',
  templateUrl: './umbral-shards.component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
   imports: [CommonModule, RouterModule, NwModule, UmbralshardsModule, LayoutModule],
   host: {
    class: 'layout-row bg-base-300 rounded-md'
  }
})
export class UmbralShardsComponent {

  public tab = 0

}
