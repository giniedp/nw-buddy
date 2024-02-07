import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { DialogModule } from '@angular/cdk/dialog'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone'
import { EQUIP_SLOTS, EquipSlot } from '@nw-data/common'
import { CharacterStore, GearsetRecord, GearsetSignalStore } from '~/data'
import { Mannequin } from '~/nw/mannequin'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { SwiperDirective } from '~/utils/directives/swiper.directive'
import { ScreenshotModule } from '~/widgets/screenshot'
import { DamageCalculatorComponent } from '../calculator/damage-calculator.component'
import { GearCellSlotComponent } from '../cells/gear-cell-slot.component'
import { GearsetPaneMainComponent } from '../cells/gearset-pane-main.component'
import { GearsetPaneSkillComponent } from '../cells/gearset-pane-skill.component'
import { GearsetPaneStatsComponent } from '../cells/gearset-pane-stats.component'
import { GearsetLoadoutItemComponent } from '../loadout'
import { GearsetPaneComponent } from './gearset-pane.component'
import { GearsetToolbarComponent } from './gearset-toolbar.component'


@Component({
  standalone: true,
  selector: 'nwb-gearset-grid',
  templateUrl: './gearset-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    CommonModule,
    DamageCalculatorComponent,
    DialogModule,
    FormsModule,
    GearCellSlotComponent,
    GearsetLoadoutItemComponent,
    GearsetPaneMainComponent,
    GearsetPaneSkillComponent,
    GearsetPaneStatsComponent,
    GearsetToolbarComponent,
    IonSegment,
    IonSegmentButton,
    IconsModule,
    LayoutModule,
    ScreenshotModule,
    SwiperDirective,
    GearsetPaneComponent,
  ],
  host: {
    class: 'block @container',
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
export class GearsetGridComponent {
  private store = inject(GearsetSignalStore)
  //protected mannequin = inject(Mannequin)

  protected get gearset() {
    return this.store.gearset()
  }
  // private injector = inject(Injector)

  // private duel = inject(DamageDuelService, { optional: true })
  // protected opponent$ = defer(() => {
  //   return toObservable(this.state.mode, { injector: this.injector }).pipe(
  //     switchMap((it) => {
  //       if (!this.duel) {
  //         return of(null)
  //       }
  //       return it === 'player' ? this.duel.opponent$ : this.duel.player$
  //     }),
  //   )
  // })

  // private mw0992 = toSignal(injectBreakpoint('(min-width: 992px)'))
  // private mw2000 = toSignal(injectBreakpoint('(min-width: 2400px)'))

  // private state = signalState<GearsetDetailState>({
  //   mode: 'player',
  //   gearset: null,
  //   opponent: null,
  //   tab: 'main',
  //   slots: EQUIP_SLOTS.filter(
  //     (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies',
  //   ),
  // })

  // protected tabs = computed(() => {
  //   if (!this.showTabs) {
  //     return null
  //   }
  //   const tabs: Array<{ label: string; id: GearsetTab }> = []
  //   tabs.push({ label: 'Main', id: 'main' })
  //   tabs.push({ label: 'Stats', id: 'stats' })
  //   tabs.push({ label: 'Skills 1', id: 'skills-1' })
  //   tabs.push({ label: 'Skills 2', id: 'skills-2' })
  //   tabs.push({ label: 'Gear', id: 'gear' })
  //   if (this.hasOpponent) {
  //     tabs.push({ label: 'Calculator', id: 'calculator' })
  //   }
  //   return tabs
  // })

  protected slotGroups = computed(() => {
    const slots = EQUIP_SLOTS.filter(
      (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies',
    )
    const result: EquipSlot[][] = []
    while (slots.length) {
      result.push(slots.splice(0, 2))
    }
    return result
  })

  // @Input()
  // public set mode(value: GearsetMode) {
  //   patchState(this.state, { mode: value })
  // }
  // public get mode() {
  //   return this.state.mode()
  // }

  // @Input()
  // public set gearset(value: GearsetRecord) {
  //   patchState(this.state, { gearset: value })
  // }
  // public get gearset() {
  //   return this.state.gearset()
  // }

  // @Input()
  // public set opponent(value: GearsetRecord) {
  //   patchState(this.state, { opponent: value })
  // }
  // public get opponent() {
  //   return this.state.opponent()
  // }

  // protected get hasOpponent() {
  //   return !!this.opponent
  // }

  // protected get isOpponent() {
  //   return this.mode === 'opponent'
  // }

  // protected get slots() {
  //   return this.state.slots()
  // }

  // protected get tab() {
  //   return this.state.tab()
  // }
  // protected set tab(value: GearsetTab) {
  //   patchState(this.state, { tab: value })
  // }

  // protected get showTabs() {
  //   return this.hasOpponent ? !this.mw2000() : !this.mw0992()
  // }

  // protected handleSegmentChange(event: SegmentCustomEvent) {
  //   this.tab = event.detail.value as GearsetTab
  // }

  // public ngOnInit() {
  //   if (!this.duel) {
  //     return
  //   }
  //   if (this.isOpponent) {
  //     this.duel.setOpponent(this.mannequin)
  //   } else {
  //     this.duel.setPlayer(this.mannequin)
  //   }
  // }
}
