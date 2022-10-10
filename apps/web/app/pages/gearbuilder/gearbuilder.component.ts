import { CommonModule } from '@angular/common'
import { Component, TrackByFunction } from '@angular/core'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { defer } from 'rxjs'
import { GearbuilderStore } from './gearbuidler-store'
import { GearSlotComponent } from './gearbuilder-slot.component'
import { SLOTS } from './slots'


@Component({
  standalone: true,
  selector: 'nwb-gearbuilder',
  templateUrl: './gearbuilder.component.html',
  imports: [CommonModule, GearSlotComponent, RouterModule],
  host: {
    class: 'layout-content flex-none overflow-x-hidden',
  },
})
export class GearbuilderComponent {
  protected slots = SLOTS.map((it) => it.id)

  protected allIds = defer(() => this.store.getIds())
  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(private store: GearbuilderStore, private router: Router, private route: ActivatedRoute) {

  }

  protected entry(id: string) {
    return this.store.observe(id)
  }

  protected async onCreateClicked() {
    const id = await this.store.create()
    this.router.navigate([id], {
      relativeTo: this.route
    })
  }
}
