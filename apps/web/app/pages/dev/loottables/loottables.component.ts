import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { defer, map } from 'rxjs'
import { NwDbService } from '~/core/nw'

@Component({
  standalone: true,
  templateUrl: './loottables.component.html',
  imports: [CommonModule],
  host: {
    class: 'layout-row gap-4',
  },
})
export class LoottablesComponent {
  protected tables = defer(() => this.db.lootTables)
  protected tags = defer(() => this.tables).pipe(
    map((tables) => {
      const conditions = new Set<string>()
      const tags = new Set<string>()
      tables.forEach((entry) => {
        const hasMaxRoll = entry.MaxRoll
        const minRoll = Math.min(...entry.Items.map((it) => Number(it.Prob)))
        const maxRoll = Math.max(...entry.Items.map((it) => Number(it.Prob)))

        if (hasMaxRoll || (!minRoll && !maxRoll)) {
          entry.Conditions?.forEach((name) => tags.add(name))
        } else {
          entry.Conditions?.forEach((name) => conditions.add(name))
        }
      })
      return {
        conditions: Array.from(conditions).sort(),
        tags: Array.from(tags).sort()
      }
    })
  )

  public constructor(private db: NwDbService) {}
}
