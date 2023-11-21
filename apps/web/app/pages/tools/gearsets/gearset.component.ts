import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { EQUIP_SLOTS, EquipSlot, EquipSlotId, getStatusEffectTownBuffIds } from '@nw-data/common'
import { combineLatest, filter, map, of, switchMap } from 'rxjs'
import { SwiperOptions } from 'swiper/types/swiper-options'
import {
  CharacterStore,
  GearsetRecord,
  GearsetStore,
  ItemInstance,
  ItemInstancesDB,
  ItemInstancesStore,
  SkillBuild,
  SkillBuildsDB,
} from '~/data'
import { NwTextContextService } from '~/nw/expression'
import { ActiveAttribute, ActiveAttributes, EquippedItem, Mannequin, MannequinState } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { svgChevronLeft } from '~/ui/icons/svg'
import { ConfirmDialogComponent } from '~/ui/layout'
import { SwiperDirective } from '~/utils/directives/swiper.directive'
import { ScreenshotModule } from '~/widgets/screenshot'
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
  ],
  providers: [GearsetStore, ItemInstancesStore, Mannequin, NwTextContextService],
  host: {
    class: 'layout-col flex-none',
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
  @Input()
  public set gearset(value: GearsetRecord) {
    this.store.load(value)
  }

  @Input()
  public compact: boolean

  @Input()
  public disabled: boolean

  @Input()
  public swiper: boolean

  protected swiperOptions: SwiperOptions = {
    slidesPerView: 'auto',
    centeredSlides: true,
    spaceBetween: 16,
    //cssMode: true,
  }

  protected gearset$ = this.store.gearset$
  protected name$ = this.store.gearsetName$
  protected isLoading$ = this.store.isLoading$
  protected iconChevronLeft = svgChevronLeft

  protected slots = EQUIP_SLOTS.filter(
    (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies',
  )
  protected ammoSlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Ammo')
  protected buffSlots = EQUIP_SLOTS.filter((it) => it.id.startsWith('buff'))
  protected ammoAndSlotsAreEmpty$ = this.store.gearsetSlots$.pipe(
    map((slots) => areSlotsEmtpy(this.ammoSlots, slots) && areSlotsEmtpy(this.buffSlots, slots)),
  )
  protected ammoAndSlotsAreEmpty = toSignal(this.ammoAndSlotsAreEmpty$)

  protected quickSlots = EQUIP_SLOTS.filter((it) => it.id.startsWith('quick'))
  protected quickSlotsAreEmpty$ = this.store.gearsetSlots$.pipe(map((slots) => areSlotsEmtpy(this.quickSlots, slots)))
  protected quickSlotsAreEmpty = toSignal(this.quickSlotsAreEmpty$)
  protected quickSlotsToDisplay$ = this.store.gearsetSlots$.pipe(
    map((gearSlots) => {
      const slots = [...this.quickSlots]
      slots.length = Math.max(...slots.map((it, index) => (gearSlots?.[it.id] ? index + 1 : 0))) + 1
      slots.length = Math.min(slots.length, 4)
      return slots
    }),
  )

  protected trophiesSlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Trophies')
  protected trophiesSlotsAreEmpty$ = this.store.gearsetSlots$.pipe(
    map((slots) => areSlotsEmtpy(this.trophiesSlots, slots)),
  )
  protected trophiesSlotsAreEmpty = toSignal(this.trophiesSlotsAreEmpty$)
  protected trophiesSlotsToDisplay$ = this.store.gearsetSlots$.pipe(
    map((gearSlots) => {
      const slots = [...this.trophiesSlots]
      slots.length = Math.max(...slots.map((it, index) => (gearSlots?.[it.id] ? index + 1 : 0))) + 1
      slots.length = Math.min(slots.length, 15)
      return slots
    }),
  )

  protected townBuffEffectIds = getStatusEffectTownBuffIds()
  protected townBuffEffectsToDisplay$ = this.store.gearsetEnforcedEffects$.pipe(
    map((effects) => {
      effects = [...(effects || [])]
      effects = effects.filter((it) => this.townBuffEffectIds.some((id) => it.id === id))
      const result = effects.map((it) => it.id)
      result.length = Math.min(effects.length + 1, 9)
      return result
    }),
  )
  protected townBuffEffectsAreEmpty$ = this.townBuffEffectsToDisplay$.pipe(map((it) => it.every((el) => !el)))
  protected townBuffEffectsAreEmpty = toSignal(this.townBuffEffectsAreEmpty$)

  protected trackByIndex = (i: number) => i

  public constructor(
    private store: GearsetStore,
    private itemsStore: ItemInstancesStore,
    private dialog: Dialog,
    private mannequin: Mannequin,
    private character: CharacterStore,
    private items: ItemInstancesDB,
    private skillBuilds: SkillBuildsDB,
    private ctx: NwTextContextService,
  ) {
    itemsStore.loadAll()
    ctx.patchState({
      attribute1: this.ctxAttribute(0),
      attribute2: this.ctxAttribute(1),
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
    this.store.updateName({ name: value })
  }

  public toggleCompactMode() {
    this.compact = !this.compact
  }

  protected onItemRemove(slot: EquipSlotId) {
    this.store.updateSlot({ slot: slot, value: null })
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

  public ngOnInit(): void {
    const src = combineLatest({
      equippedItems: this.store.gearsetSlots$.pipe(switchMap((slots) => this.resolveSlots(slots))),
      level: this.character.level$,
      assignedAttributes: this.store.gearsetAttrs$,
      equippedSkills1: this.store.skillsPrimary$.pipe(switchMap((it) => this.resolveSkillBuild(it))),
      equippedSkills2: this.store.skillsSecondary$.pipe(switchMap((it) => this.resolveSkillBuild(it))),
      enforcedEffects: this.store.gearsetEnforcedEffects$,
      enforcedAbilities: this.store.gearsetEnforcedAbilities$,
    }).pipe(
      map((it): MannequinState => {
        return {
          equippedItems: it.equippedItems,
          assignedAttributes: it.assignedAttributes,
          equppedSkills1: it.equippedSkills1,
          equppedSkills2: it.equippedSkills2,
          level: it.level,
          enforcedEffects: it.enforcedEffects,
          enforcedAbilities: it.enforcedAbilities,
        }
      }),
    )
    this.mannequin.patchState(src)
  }

  private resolveSlots(slots: Record<string, string | ItemInstance>) {
    const slots$ = Object.entries(slots || {}).map(([slotId, instanceOrId]) => {
      return this.resolveItemInstance(instanceOrId).pipe(
        map((instance): EquippedItem => {
          return {
            itemId: instance.itemId,
            perks: instance.perks,
            slot: slotId as EquipSlotId,
            gearScore: instance.gearScore,
          }
        }),
      )
    })
    if (slots$.length === 0) {
      return of([])
    }
    return combineLatest(slots$)
  }

  private resolveItemInstance(idOrInstance: string | ItemInstance) {
    if (typeof idOrInstance === 'string') {
      return this.items.live((t) => t.get(idOrInstance))
    }
    return of(idOrInstance)
  }

  private resolveSkillBuild(idOrInstance: string | SkillBuild) {
    if (typeof idOrInstance === 'string') {
      return this.skillBuilds.live((t) => t.get(idOrInstance))
    }
    return of(idOrInstance)
  }

  protected onEffectChange(data: Array<{ id: string; stack: number }>) {
    this.store.updateStatusEffect(data)
  }
}

function areSlotsEmtpy(slots: EquipSlot[], gearSlots: Record<string, string | ItemInstance>) {
  return !gearSlots || !slots || !slots.length || slots.every((it) => !gearSlots[it.id])
}
