import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { defer, map } from 'rxjs'
import { NwDataService } from '~/data'
import { observeRouteParam } from '~/utils'
import { LootModule } from '~/widgets/loot'

@Component({
  standalone: true,
  templateUrl: './loottables.component.html',
  imports: [CommonModule, LootModule, FormsModule],
  host: {
    class: 'layout-col  p-3',
  },
})
export class DevLootComponent {
  public id$ = observeRouteParam(this.route, 'id')
  // protected tables = defer(() => this.db.lootTables)
  // protected tags = defer(() => this.tables).pipe(
  //   map((tables) => {
  //     const conditions = new Set<string>()
  //     const tags = new Set<string>()
  //     tables.forEach((entry) => {
  //       const hasMaxRoll = entry.MaxRoll
  //       const minRoll = Math.min(...entry.Items.map((it) => Number(it.Prob)))
  //       const maxRoll = Math.max(...entry.Items.map((it) => Number(it.Prob)))

  //       if (hasMaxRoll || (!minRoll && !maxRoll)) {
  //         entry.Conditions?.forEach((name) => tags.add(name))
  //       } else {
  //         entry.Conditions?.forEach((name) => conditions.add(name))
  //       }
  //     })
  //     return {
  //       conditions: Array.from(conditions).sort(),
  //       tags: Array.from(tags).sort()
  //     }
  //   })
  // )

  protected showLocked = false

  public constructor(private db: NwDataService, private route: ActivatedRoute) {
    //
  }
}
