import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input, computed, effect, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EQUIP_SLOTS, EquipSlot, EquipSlotId, getStatusEffectTownBuffIds } from '@nw-data/common'
import { filter, map } from 'rxjs'
import { SwiperOptions } from 'swiper/types/swiper-options'
import { GearsetRecord, GearsetSignalStore, ItemInstance, ItemInstancesDB } from '~/data'
import { NwTextContextService } from '~/nw/expression'
import { ActiveAttribute, ActiveAttributes, Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { ConfirmDialogComponent, LayoutModule } from '~/ui/layout'
import { SwiperDirective } from '~/utils/directives/swiper.directive'
import { ScreenshotModule } from '~/widgets/screenshot'
import { DamageCalculatorComponent } from './calculator/damage-calculator.component'
import { GearsetPaneEffectComponent } from './panes/gearset-pane-effect.component'
import { GearsetPaneMainComponent } from './panes/gearset-pane-main.component'
import { GearsetPaneSkillComponent } from './panes/gearset-pane-skill.component'
import { GearsetPaneSlotComponent } from './panes/gearset-pane-slot.component'
import { GearsetPaneStatsComponent } from './panes/gearset-pane-stats.component'

@Component({
  standalone: true,
  selector: 'nwb-gearset',
  templateUrl: './gearset.component.html',
  styleUrls: ['./gearset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'gearsetDetail',
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    GearsetPaneMainComponent,
    GearsetPaneSkillComponent,
    GearsetPaneSlotComponent,
    GearsetPaneStatsComponent,
    GearsetPaneEffectComponent,
    IconsModule,
    ScreenshotModule,
    SwiperDirective,
    LayoutModule,
    DamageCalculatorComponent,
  ],
  providers: [GearsetSignalStore, Mannequin, NwTextContextService],
  host: {
    class: 'layout-col',
  },
  animations: [
    trigger('list', [
      transition('* => *', [
        query(':enter', stagger(25, animateChild()), {
          optional: true,
        }),
      ]),
    ]),
    trigger('fade', [transition('* => *', [style({ opacity: 0 }), animate('0.3s ease-out', style({ opacity: 1 }))])]),
  ],
})
export class GearsetDetailComponent {
  private store = inject(GearsetSignalStore)
  private itemDb = inject(ItemInstancesDB)

  @Input()
  public set gearset(value: GearsetRecord) {
    this.store.connectGearset(value)
  }
  public get gearset() {
    return this.store.gearset()
  }

  @Input()
  public compact: boolean

  @Input()
  public disabled: boolean

  @Input()
  public calculator: boolean

  @Input()
  public swiper: boolean

  protected swiperOptions: SwiperOptions = {
    slidesPerView: 'auto',
    centeredSlides: true,
    spaceBetween: 16,
    //cssMode: true,
  }

  protected get name() {
    return this.store.gearsetName()
  }
  protected get isLoading() {
    return !this.store.isLoaded()
  }

  protected iconChevronLeft = svgChevronLeft

  protected slots = EQUIP_SLOTS.filter(
    (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies',
  )
  protected ammoSlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Ammo')
  protected buffSlots = EQUIP_SLOTS.filter((it) => it.id.startsWith('buff'))
  protected buffSlotsAreEmpty = computed(() => {
    const slots = this.store.gearsetSlots()
    return areSlotsEmtpy(this.ammoSlots, slots) && areSlotsEmtpy(this.buffSlots, slots)
  })

  protected quickSlots = EQUIP_SLOTS.filter((it) => it.id.startsWith('quick'))
  protected quickSlotsAreEmpty = computed(() => {
    const slots = this.store.gearsetSlots()
    areSlotsEmtpy(this.quickSlots, slots)
  })
  protected quickSlotsToDisplay = computed(() => {
    const gearSlots = this.store.gearsetSlots()
    const slots = [...this.quickSlots]
    slots.length = Math.max(...slots.map((it, index) => (gearSlots?.[it.id] ? index + 1 : 0))) + 1
    slots.length = Math.min(slots.length, 4)
    return slots
  })

  protected trophiesSlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Trophies')
  protected trophiesSlotsAreEmpty = computed(() => {
    const slots = this.store.gearsetSlots()
    return areSlotsEmtpy(this.trophiesSlots, slots)
  })
  protected trophiesSlotsToDisplay = computed(() => {
    const gearSlots = this.store.gearsetSlots()
    const slots = [...this.trophiesSlots]
    slots.length = Math.max(...slots.map((it, index) => (gearSlots?.[it.id] ? index + 1 : 0))) + 1
    slots.length = Math.min(slots.length, 15)
    return slots
  })

  protected townBuffEffectIds = getStatusEffectTownBuffIds()
  protected townBuffEffectsToDisplay = computed(() => {
    let effects = this.store.gearset().enforceEffects
    effects = [...(effects || [])]
    effects = effects.filter((it) => !!it.stack && this.townBuffEffectIds.some((id) => it.id === id))
    const result = effects.map((it) => it.id)
    result.length = Math.min(effects.length + 1, 9)
    return result
  })
  protected townBuffEffectsAreEmpty = computed(() => {
    return this.townBuffEffectsToDisplay().every((it) => !it)
  })

  public constructor(
    private dialog: Dialog,
    private mannequin: Mannequin,
    ctx: NwTextContextService,
  ) {
    ctx.patchState({
      attribute1: this.ctxAttribute(0),
      attribute2: this.ctxAttribute(1),
    })
    this.store.connectToMannequin(this.mannequin)

    effect(() => {

      this.store.resolvedSlots().find((it) => it.slot === 'weapon1')
    })
  }

  private ctxAttribute(index: number) {
    const order: Array<keyof ActiveAttributes> = ['con', 'foc', 'str', 'dex', 'int']
    const getValue = (attr: ActiveAttribute) => attr.base + attr.bonus + attr.assigned

    return this.mannequin.activeAttributes$.pipe(
      map((attrs) => {
        const sorted = order
          .map((key) => {
            return {
              key,
              value: getValue(attrs[key]),
            }
          })
          .sort((a, b) => b.value - a.value)
        return sorted[index].key
      }),
    )
  }

  protected updateName(value: string) {
    this.store.patchGearset({ name: value })
  }

  public toggleCompactMode() {
    this.compact = !this.compact
  }

  protected onItemRemove(slot: EquipSlotId) {
    this.store.updateSlot(slot, null)
  }

  protected async onItemUnlink(slot: EquipSlot, record: ItemInstance) {
    this.store.updateSlot(slot.id, {
      gearScore: record.gearScore,
      itemId: record.itemId,
      perks: record.perks,
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
        const instance = await this.itemDb.create({
          gearScore: record.gearScore,
          itemId: record.itemId,
          perks: record.perks,
        })
        this.store.updateSlot(slot.id, instance.id)
      })
  }

  protected onEffectChange(data: Array<{ id: string; stack: number }>) {
    this.store.updateStatusEffects(data)
  }
}

function areSlotsEmtpy(slots: EquipSlot[], gearSlots: Record<string, string | ItemInstance>) {
  return !gearSlots || !slots || !slots.length || slots.every((it) => !gearSlots[it.id])
}
