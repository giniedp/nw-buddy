import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NwModule } from '~/nw';
import { LayoutModule } from '~/ui/layout';
import { HtmlHeadService } from '~/utils';
import { UmbralshardsModule } from '~/widgets/umbralshards';

@Component({
  standalone: true,
  selector: 'nwb-umbral-shards-page',
  templateUrl: './umbral-shards.component.html',
   changeDetection: ChangeDetectionStrategy.OnPush,
   imports: [CommonModule, RouterModule, NwModule, UmbralshardsModule, LayoutModule],
   host: {
    class: 'layout-row'
  }
})
export class UmbralShardsComponent {

  public tab = 0

  protected showGsInfo = false
  public constructor(head: HtmlHeadService) {
    head.updateMetadata({
      title: 'Umbral Shard & Gear Score Calculator',
      description: 'Calculates total gear score and the most effective umbral shard upgrade path'
    })
  }
}
