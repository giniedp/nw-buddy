import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, Injector, Input, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BehaviorSubject, combineLatest, filter, map, of, switchMap } from 'rxjs'

import { NwDbService, NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop'
import { EquipSlotId, getWeaponTagFromWeapon } from '@nw-data/common'
import { GearsetRecord, GearsetSkillSlot, GearsetSkillStore, ItemInstancesDB, SkillBuild, SkillBuildsDB } from '~/data'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { DataViewAdapterOptions, DataViewPicker } from '~/ui/data/data-view'
import { IconsModule } from '~/ui/icons'
import {
  svgDiagramProject,
  svgEllipsisVertical,
  svgFolderOpen,
  svgLink16p,
  svgLinkSlash16p,
  svgPlus,
  svgRotate,
  svgTrashCan,
} from '~/ui/icons/svg'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { SkillsetTableAdapter, SkillsetTableRecord } from '~/widgets/data/skillset-table'
import { openWeaponTypePicker } from '~/widgets/data/weapon-type'
import { SkillTreeModule } from '~/widgets/skill-builder'
import { eqCaseInsensitive } from '~/utils'

export interface GearsetSkillVM {
  slot?: GearsetSkillSlot
  gearset?: GearsetRecord
  instance?: SkillBuild
  canRemove?: boolean
  canBreak?: boolean
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-pane-skill',
  templateUrl: './gearset-pane-skill.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    DialogModule,
    FormsModule,
    OverlayModule,
    ItemDetailModule,
    IconsModule,
    LayoutModule,
    SkillTreeModule,
    TooltipModule,
  ],
  providers: [GearsetSkillStore],
  host: {
    class: 'flex flex-col relative',
    '[class.screenshot-hidden]': '!instance()',
  },
})
export class GearsetPaneSkillComponent {
  @Input()
  public set slot(value: GearsetSkillSlot) {
    this.slot$.next(value)
  }
  public get slot() {
    return this.slot$.value
  }

  @Input()
  public set gearset(value: GearsetRecord) {
    this.gearset$.next(value)
  }
  public get gearset() {
    return this.gearset$.value
  }

  @Input()
  public compact: boolean

  @Input()
  public disabled: boolean

  protected iconMenu = svgEllipsisVertical
  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconReset = svgRotate
  protected iconGraph = svgDiagramProject
  protected iconPlus = svgPlus
  protected iconOpen = svgFolderOpen

  protected instance = toSignal(this.store.instance$)

  private slot$ = new BehaviorSubject<GearsetSkillSlot>(null)
  private gearset$ = new BehaviorSubject<GearsetRecord>(null)
  private destroyRef = inject(DestroyRef)

  public constructor(
    private store: GearsetSkillStore,
    private skillsDB: SkillBuildsDB,
    private itemsDB: ItemInstancesDB,
    private dialog: Dialog,
    private injector: Injector,
    private db: NwDbService,
  ) {
    //
  }

  public ngOnInit(): void {
    this.store.useSlot(
      combineLatest({
        gearset: this.gearset$,
        slot: this.slot$,
      }),
    )
    if (!this.disabled) {
      this.attachAutoSwitchSkill()
    }
  }

  protected updateSkill(value: SkillBuild) {
    this.store.updateSlot({ instance: value })
  }

  protected createNew() {
    openWeaponTypePicker({
      dialog: this.dialog,
      injector: this.injector,
    })
      .closed.pipe(
        filter((it) => !!it?.length),
        map((it) => NW_WEAPON_TYPES.find((type) => type.WeaponTypeID === String(it[0]))),
      )
      .subscribe((weapon) => {
        this.store.updateSlot({
          instance: {
            weapon: weapon.WeaponTag,
            tree1: [],
            tree2: [],
          },
        })
      })
  }

  protected openExisting(weapon: string) {
    DataViewPicker.open<SkillsetTableRecord>(this.dialog, {
      title: 'Choose Skill Tree',
      selection: null,
      dataView: {
        adapter: SkillsetTableAdapter,
        filter: (it) => eqCaseInsensitive(it.record?.weapon, weapon),
      },
      displayMode: ['grid'],
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: this.injector,
      },
    })
      .closed.pipe(map((it) => it?.[0]))
      .pipe(filter((it) => !!it))
      .pipe(switchMap((id: string) => this.skillsDB.read(id)))
      .subscribe((value) => {
        this.store.updateSlot({
          instance: {
            weapon: value.weapon,
            tree1: value.tree1,
            tree2: value.tree2,
          },
        })
      })
  }

  protected reset() {
    this.store.updateSlot({
      instance: {
        weapon: this.instance()?.weapon,
        tree1: [],
        tree2: [],
      },
    })
  }

  private attachAutoSwitchSkill() {
    combineLatest({
      items: this.db.itemsMap,
      stats: this.db.weaponsMap,
      itemId: combineLatest({
        gearset: this.gearset$,
        slot: this.slot$,
      }).pipe(
        switchMap(({ gearset, slot }) => {
          const slotId: EquipSlotId = slot === 'primary' ? 'weapon1' : 'weapon2'
          const it = gearset?.slots?.[slotId]
          if (!it) {
            return of(null)
          }
          if (typeof it === 'string') {
            return this.itemsDB.observeByid(it).pipe(map((it) => it?.itemId))
          }
          return of(it.itemId)
        }),
      ),
    })
      .pipe(
        map(({ items, stats, itemId }) => {
          const item = items.get(itemId)
          const weapon = stats.get(item?.ItemStatsRef)
          return {
            item,
            weapon,
          }
        }),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ item, weapon }) => {
        const instance = this.instance()
        const weaponTag = getWeaponTagFromWeapon(weapon)
        if (!instance || instance.weapon !== weaponTag) {
          this.updateSkill({
            weapon: weaponTag,
            tree1: [],
            tree2: [],
          })
        }
      })
  }
}
