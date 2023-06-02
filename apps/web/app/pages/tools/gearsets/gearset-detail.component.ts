import { animate, animateChild, query, stagger, state, style, transition, trigger } from '@angular/animations'
import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { AfterContentInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Statuseffect } from '@nw-data/generated'
import { combineLatest, filter, map, of, switchMap } from 'rxjs'
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
import { EquippedItem, Mannequin, MannequinState } from '~/nw/mannequin'
import { EquipSlot, EquipSlotId, EQUIP_SLOTS, getStatusEffectTownBuffIds } from '@nw-data/common'
import { IconsModule } from '~/ui/icons'
import { ConfirmDialogComponent } from '~/ui/layout'
import { ScreenshotModule } from '~/widgets/screenshot'
import { GearsetPaneEffectComponent } from './gearset-pane-effect.component'
import { GearsetPaneMainComponent } from './gearset-pane-main.component'
import { GearsetPaneSkillComponent } from './gearset-pane-skill.component'
import { GearsetPaneSlotComponent } from './gearset-pane-slot.component'
import { GearsetPaneStatsComponent } from './gearset-pane-stats.component'
import { SwiperOptions } from 'swiper'
import { SwiperDirective } from '~/utils/directives/swiper.directive'
import { svgChevronLeft } from '~/ui/icons/svg'

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
    GearsetPaneMainComponent,
    GearsetPaneSkillComponent,
    GearsetPaneSlotComponent,
    GearsetPaneStatsComponent,
    GearsetPaneEffectComponent,
    IconsModule,
    ScreenshotModule,
    SwiperDirective,
  ],
  providers: [GearsetStore, ItemInstancesStore, Mannequin],
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
    (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies'
  )
  protected ammoSlots = EQUIP_SLOTS.filter((it) => it.itemType === 'Ammo')
  protected buffSlots = EQUIP_SLOTS.filter((it) => it.id.startsWith('buff'))

  protected vmQuickSlots$ = combineLatest({
    slots: of(EQUIP_SLOTS.filter((it) => it.id.startsWith('quick'))),
    gearset: this.gearset$,
  }).pipe(
    map(({ slots, gearset }) => {
      const gsSlots = gearset?.slots || []
      slots = [...slots]
      slots.length = Math.max(...slots.map((it, index) => (gsSlots[it.id] ? index + 1 : 0))) + 1
      slots.length = Math.min(slots.length, 4)
      return {
        slots,
        empty: slots.every((slot) => !gsSlots[slot.id]),
      }
    })
  )

  protected vmTrophies$ = combineLatest({
    slots: of(EQUIP_SLOTS.filter((it) => it.itemType === 'Trophies')),
    gearset: this.gearset$,
  }).pipe(
    map(({ slots, gearset }) => {
      const gsSlots = gearset?.slots || []
      slots = [...slots]
      slots.length = Math.max(...slots.map((it, index) => (gsSlots[it.id] ? index + 1 : 0))) + 1
      slots.length = Math.min(slots.length, 15)
      return {
        slots,
        empty: slots.every((slot) => !gsSlots[slot.id]),
      }
    })
  )

  protected vmTownBuffs$ = this.gearset$.pipe(
    map((it) => {
      const townEffects = getStatusEffectTownBuffIds()
      const effects = (it.enforceEffects || [])
        .filter((it) => townEffects.some((id) => it.id === id))
        .map((it) => it.id)
      effects.length = Math.min(effects.length + 1, 9)
      return effects
    })
  )

  protected trackByIndex = (i: number) => i

  public constructor(
    private store: GearsetStore,
    private itemsStore: ItemInstancesStore,
    private dialog: Dialog,
    private mannequin: Mannequin,
    private character: CharacterStore,
    private items: ItemInstancesDB,
    private skillBuilds: SkillBuildsDB
  ) {
    itemsStore.loadAll()
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
      })
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
        })
      )
    })
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
