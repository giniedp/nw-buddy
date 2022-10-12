import { CommonModule } from '@angular/common'
import { Component, ElementRef, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { firstValueFrom, map, switchMap } from 'rxjs'
import { observeRouteParam } from '~/utils'
import { GearbuilderStore } from './gearbuidler-store'
import { GearSlotComponent } from './gearbuilder-slot.component'
import { SLOTS } from './slots'
import { toBlob } from 'html-to-image'

@Component({
  standalone: true,
  selector: 'nwb-gearbuilder-entry',
  templateUrl: './gearbuilder-entry.component.html',
  imports: [CommonModule, GearSlotComponent, RouterModule, FormsModule],
  styleUrls: ['./gearbuilder-entry.component.scss'],
  host: {
    class: 'layout-content flex-none overflow-x-hidden',
  },
})
export class GearbuilderEntryComponent {
  protected id$ = observeRouteParam(this.route, 'id')
  protected data$ = this.id$.pipe(switchMap((id) => this.store.observe(id)))
  protected name$ = this.data$.pipe(map((it) => it?.name))

  protected slots = SLOTS.map((it) => it.id)

  @ViewChild('pane', { read: ElementRef })
  protected pane: ElementRef<HTMLElement>

  public constructor(private router: Router, private route: ActivatedRoute, private store: GearbuilderStore) {}

  protected async updateName(value: string) {
    const id = await firstValueFrom(this.id$)
    this.store.update(id, (data) => {
      data.name = value
      return data
    })
  }

  protected async onScreenshotClicked() {
    const el = this.pane.nativeElement
    const blob = await toBlob(el)
    navigator.clipboard.write([
      new ClipboardItem({
        'image/png': blob,
      }),
    ])
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
