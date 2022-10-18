import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { asyncScheduler, firstValueFrom, map, subscribeOn, switchMap } from 'rxjs'
import { observeRouteParam } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearbuilderStatsComponent } from './gearbuilder-stats.component'
import { GearbuilderStore } from './gearbuidler-store'
import { GearSlotComponent } from './gearbuilder-slot.component'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { EQUIP_SLOTS } from '~/nw/utils'

@Component({
  standalone: true,
  selector: 'nwb-gearbuilder-set',
  templateUrl: './gearbuilder-set.component.html',
  imports: [
    CommonModule,
    GearSlotComponent,
    RouterModule,
    FormsModule,
    GearbuilderStatsComponent,
    ScreenshotModule,
    DialogModule,
  ],
  styleUrls: ['./gearbuilder-set.component.scss'],
  host: {
    class: 'layout-content flex-none overflow-x-hidden',
  },
})
export class GearbuilderSetComponent {
  protected id$ = observeRouteParam(this.route, 'id')
  protected data$ = this.id$.pipe(switchMap((id) => this.store.observe(id)))
  protected name$ = this.data$.pipe(map((it) => it?.name))

  protected slots = EQUIP_SLOTS
  protected compactMode = false

  public constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: GearbuilderStore,
    private dialog: Dialog
  ) {
    //
  }

  protected async updateName(value: string) {
    const id = await firstValueFrom(this.id$)
    this.store.update(id, (data) => {
      data.name = value
      return data
    })
  }

  protected onCompactClicked() {
    this.compactMode = !this.compactMode
  }

  protected async onCloneClicked() {
    const data = await firstValueFrom(this.data$)
    const id = await this.store.create({
      name: data?.name ? `${data?.name} (copy)` : 'Unnamed Gearset',
      items: JSON.parse(JSON.stringify(data?.items)),
    })
    this.router.navigate(['..', id], { relativeTo: this.route })
  }

  protected async onDeleteClicked() {
    const id = await firstValueFrom(this.id$)
    this.store.delete(id)
    this.router.navigate(['..'], { relativeTo: this.route })
  }
}
