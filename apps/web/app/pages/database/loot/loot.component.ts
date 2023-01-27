import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { NwDbService } from '~/nw'
import { observeRouteParam } from '~/utils'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  selector: 'nwb-loot-page',
  templateUrl: './loot.component.html',
  imports: [CommonModule, LootModule, FormsModule],
  host: {
    class: 'layout-col  p-3',
  },
})
export class LootPageComponent {
  public id$ = observeRouteParam(this.route, 'id')


  protected showLocked = false

  public constructor(private db: NwDbService, private route: ActivatedRoute) {
    //
  }
}
