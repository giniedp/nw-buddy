import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NwModule } from '~/nw'
import { DataViewService } from '~/ui/data/data-view'
import { VirtualGridModule } from '~/ui/data/virtual-grid'
import { HtmlHeadService, eqCaseInsensitive, observeRouteParam } from '~/utils'
import { SchematicCellComponent, SchematicRecord } from './adapter'
import { ActivatedRoute } from '@angular/router'
import { map } from 'rxjs'

@Component({
  selector: 'nwb-schematics-tracking',
  templateUrl: './schematics-tracking.component.html',
  styleUrl: './schematics-tracking.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, VirtualGridModule],
  host: {
    class: 'ion-page',
  },
})
export class SchematicsTrackingComponent {
  protected gridOptions = observeRouteParam(this.route, 'category').pipe(
    map((it) => {
      if (eqCaseInsensitive(it, 'furnishing')) {
        return SchematicCellComponent.buildGridOptions()
      }
      return SchematicCellComponent.buildGridOptionsWeapons()
    }),
  )

  public constructor(
    private route: ActivatedRoute,
    protected service: DataViewService<SchematicRecord>,
    head: HtmlHeadService,
  ) {
    head.updateMetadata({
      title: 'Schematics Recipes',
      description: 'Overview of all schematics in New World.',
    })
  }
}
