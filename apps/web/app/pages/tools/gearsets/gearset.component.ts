import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { Component, TrackByFunction } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import { filter, firstValueFrom, switchMap } from 'rxjs'
import { GearsetsDB, GearsetStore, ItemInstance, ItemInstanceRecord } from '~/data'
import { EquipSlot, EQUIP_SLOTS } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { svgCamera, svgChevronLeft, svgClipboard, svgPaste, svgTrashCan } from '~/ui/icons/svg'
import { ConfirmDialogComponent, PromptDialogComponent } from '~/ui/modal'
import { TooltipModule } from '~/ui/tooltip'
import { observeRouteParam } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearsetSlotComponent } from './gearset-slot.component'
import { GearsetStatsComponent } from './gearset-stats.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset',
  templateUrl: './gearset.component.html',
  imports: [
    CommonModule,
    GearsetSlotComponent,
    RouterModule,
    FormsModule,
    GearsetStatsComponent,
    ScreenshotModule,
    DialogModule,
    IconsModule,
    TooltipModule,
  ],
  providers: [GearsetStore],
  styleUrls: ['./gearset.component.scss'],
  host: {
    class: 'layout-content flex-none overflow-x-hidden',
  },
  animations: [
    trigger('listAnimation', [
      transition('void => *', [
        query(':enter', [style({ opacity: 0 }), stagger(50, [animate('0.3s', style({ opacity: 1 }))])]),
      ]),
    ]),
    trigger('apperAnimation', [
      state('*', style({ opacity: 0 })),
      state('true', style({ opacity: 1 })),
      transition('* => true', [animate('0.3s')]),
    ]),
  ]
})
export class GearsetComponent {
  protected id$ = observeRouteParam(this.route, 'id')

  protected data$ = this.store.gearset$
  protected name$ = this.store.gearsetName$
  protected isLoading$ = this.store.isLoading$

  protected slots = EQUIP_SLOTS
  protected compactMode = false
  protected iconCamera = svgCamera
  protected iconDelete = svgTrashCan
  protected iconCopy = svgPaste
  protected iconBack = svgChevronLeft
  // protected iconCompact = svgex
  protected trackByIndex: TrackByFunction<any> = (i) => i

  public constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: GearsetStore,
    private gearDb: GearsetsDB,
    private dialog: Dialog
  ) {
    store.loadById(this.id$)
  }

  protected updateName(value: string) {
    this.store.updateName({ name: value })
  }

  protected onCompactClicked() {
    this.compactMode = !this.compactMode
  }

  protected async onCloneClicked() {
    const oldSet = await firstValueFrom(this.store.gearset$)
    PromptDialogComponent.open(this.dialog, {
      data: {
        title: 'Create copy',
        body: 'Give this set a new name',
        input: `${oldSet.name} (Copy)`,
        positive: 'Create',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.gearDb.create({
            ...oldSet,
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
        this.store.destroySet()
        this.router.navigate(['..'], { relativeTo: this.route })
      })
  }

  protected onItemRemove(slot: EquipSlot) {
    this.store.updateSlot({ slot: slot.id, value: null })
  }

  protected async onItemUnlink(slot: EquipSlot, record: ItemInstance) {
    this.store.updateSlot({
      slot: slot.id,
      value: {
        gearScore: record.gearScore,
        itemId: record.itemId,
        perks: record.perks,
      },
    })
  }

  protected goBack() {
    history.back()
  }
}
