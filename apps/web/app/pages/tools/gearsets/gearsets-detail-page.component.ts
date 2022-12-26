import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, TrackByFunction } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { IonicModule } from '@ionic/angular'
import { LetModule } from '@ngrx/component'
import { combineLatest, filter, firstValueFrom, map, switchMap } from 'rxjs'
import { GearsetsDB, ItemInstance, ItemInstanceRecord, ItemInstancesDB } from '~/data'
import { ShareDialogComponent } from '~/pages/web3'
import { IconsModule } from '~/ui/icons'
import { svgCamera, svgChevronLeft, svgCompress, svgExpand, svgPaste, svgShareNodes, svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { deferState, observeRouteParam } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearsetDetailComponent } from './gearset-detail.component'
@Component({
  standalone: true,
  selector: 'nwb-gearsets-detail-page',
  templateUrl: './gearsets-detail-page.component.html',
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    IconsModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    IonicModule,
    GearsetDetailComponent,
    LetModule,
  ],
  host: {
    class: 'layout-col flex-none',
  },
})
export class GearsetsDetailPageComponent {
  protected id$ = observeRouteParam(this.route, 'id')
  protected record$ = this.gearDb.observeByid(this.id$)

  protected vm$ = combineLatest({
    record: this.record$,
    name: this.record$.pipe(map((it) => it.name)),
  })

  protected compact = false
  protected iconCamera = svgCamera
  protected iconDelete = svgTrashCan
  protected iconCopy = svgPaste
  protected iconBack = svgChevronLeft
  protected iconCompact = svgCompress
  protected iconShare = svgShareNodes

  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(
    private router: Router,
    private route: ActivatedRoute,
    private gearDb: GearsetsDB,
    private itemsDb: ItemInstancesDB,
    private dialog: Dialog
  ) {}

  protected async updateName(value: string) {
    const record = await firstValueFrom(this.record$)
    this.gearDb.update(record.id, {
      ...record,
      name: value,
    })
  }

  protected onCompactClicked() {
    this.compact = !this.compact
  }

  protected async onCloneClicked() {
    const record = await firstValueFrom(this.record$)
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Create copy',
        body: 'New gearset name',
        input: `${record.name} (Copy)`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.gearDb.create({
            ...record,
            id: null,
            name: newName,
          })
        })
      )
      .subscribe((newSet) => {
        this.router.navigate(['..', newSet.id], { relativeTo: this.route })
      })
  }

  protected async onDeleteClicked() {
    const record = await firstValueFrom(this.record$)
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Delete Gearset',
        body: 'Are you sure you want to delete this gearset?',
        positive: 'Delete',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe(() => {
        this.gearDb.destroy(record.id)
        this.router.navigate(['..'], { relativeTo: this.route })
      })
  }

  protected async onShareClicked() {
    const record = await firstValueFrom(this.record$).then((it) => ({ ...it }))
    record.imageId = null
    record.createMode = null
    for (const [slot, it] of Object.entries(record.slots)) {
      if (typeof it === 'string') {
        record.slots[slot] = await this.itemsDb
          .read(it)
          .then((it): ItemInstance => {
            return {
              gearScore: it.gearScore,
              itemId: it.itemId,
              perks: it.perks,
            }
          })
          .catch(() => null as ItemInstance)
      }
    }

    ShareDialogComponent.open(this.dialog, {
      data: {
        data: {
          ref: record.id,
          type: 'gearset',
          data: record,
        },
        buildUrl: (cid) => {
          return (
            location.origin +
            this.router
              .createUrlTree(['..', 'share', cid], {
                relativeTo: this.route,
              })
              .toString()
          )
        },
      },
    })
  }

  protected goBack() {
    history.back()
  }
}
