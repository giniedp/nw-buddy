import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { defer, map } from 'rxjs'
import { NwDataService } from '~/data'

@Component({
  standalone: true,
  templateUrl: './lootbuckets.component.html',
  imports: [CommonModule],
  host: {
    class: 'layout-row layout-gap',
  },
})
export class LootbucketsComponent {
  protected buckets = defer(() => this.db.lootBuckets)
  protected tags = defer(() => this.buckets).pipe(
    map((buckets) => {
      const tags = new Set<string>()
      const conditions = new Set<string>()
      buckets.forEach((it) => {
        it.Tags.forEach((tag) => {
          if (tag.Value != null) {
            conditions.add(tag.Name)
          } else {
            tags.add(tag.Name)
          }
        })
      })

      return {
        tags: Array.from(tags).sort(),
        conditions: Array.from(conditions).sort(),
      }
    })
  )

  public constructor(private db: NwDataService) {}
}
