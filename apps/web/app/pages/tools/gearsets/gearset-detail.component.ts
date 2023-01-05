import { animate, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { filter } from 'rxjs'
import { GearsetRecord, GearsetStore, ItemInstance, ItemInstancesStore } from '~/data'
import { EquipSlot, EQUIP_SLOTS } from '~/nw/utils'
import { IconsModule } from '~/ui/icons'
import { ConfirmDialogComponent } from '~/ui/layout'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearsetSkillComponent } from './gearset-skill.component'
import { GearsetSlotComponent } from './gearset-slot.component'
import { GearsetStatsComponent } from './gearset-stats.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset-detail',
  templateUrl: './gearset-detail.component.html',
  styleUrls: ['./gearset-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'gearsetDetail',
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    GearsetSkillComponent,
    GearsetSlotComponent,
    GearsetStatsComponent,
    IconsModule,
    ScreenshotModule,
  ],
  providers: [GearsetStore, ItemInstancesStore],
  host: {
    class: 'layout-col flex-none',
  },
  animations: [
    trigger('listAnimation', [
      transition('void => *', [
        query(':enter', [style({ opacity: 0 }), stagger(50, [animate('0.3s', style({ opacity: 1 }))])], {
          optional: true,
        }),
      ]),
    ]),
    trigger('apperAnimation', [
      state('*', style({ opacity: 0 })),
      state('true', style({ opacity: 1 })),
      transition('* => true', [animate('0.3s')]),
    ]),
  ],
})
export class GearsetDetailComponent {

  @Input()
  public set gearset(value: GearsetRecord) {
    this.store.load(value)
  }

  @Input()
  public compact: boolean

  @Input()
  public disabled: boolean

  protected gearset$ = this.store.gearset$
  protected name$ = this.store.gearsetName$
  protected isLoading$ = this.store.isLoading$

  protected slots = EQUIP_SLOTS.filter((it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies')
  protected buffSlots = EQUIP_SLOTS.filter((it) => it.id.startsWith('buff'))
  protected quickSlots = EQUIP_SLOTS.filter((it) => it.id.startsWith('quick'))
  protected ammoSlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Ammo')
  protected trophiesSlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Trophies')

  protected trackByIndex = (i: number) => i

  public constructor(
    private store: GearsetStore,
    private itemsStore: ItemInstancesStore,
    private dialog: Dialog
  ) {
    itemsStore.loadAll()
  }

  protected updateName(value: string) {
    this.store.updateName({ name: value })
  }

  public toggleCompactMode() {
    this.compact = !this.compact
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

  protected async onItemInstantiate(slot: EquipSlot, record: ItemInstance) {
    ConfirmDialogComponent.open(this.dialog, {
      data: {
        title: 'Convert to link',
        body: 'This will create a new item in your inventory and link it to the slot.',
        positive: 'Convert',
        negative: 'Cancel',
      },
    })
      .closed.pipe(filter((it) => !!it))
      .subscribe(async () => {
        const instance = await this.itemsStore.db.create({
          gearScore: record.gearScore,
          itemId: record.itemId,
          perks: record.perks,
        })
        this.store.updateSlot({
          slot: slot.id,
          value: instance.id,
        })
      })
  }

}
