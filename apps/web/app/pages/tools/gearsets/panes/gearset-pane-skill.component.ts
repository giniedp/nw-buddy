import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, Input, effect, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { filter, map, switchMap } from 'rxjs'

import { GearsetsDB } from '~/data'
import { NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { patchState } from '@ngrx/signals'
import { GearsetRecord, GearsetSkillSlot, SkillBuildsDB, SkillSet } from '~/data'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'
import { DataViewPicker } from '~/ui/data/data-view'
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
import { eqCaseInsensitive } from '~/utils'
import { SkillsetTableAdapter, SkillsetTableRecord } from '~/widgets/data/skillset-table'
import { openWeaponTypePicker } from '~/widgets/data/weapon-type'
import { SkillTreeModule } from '~/widgets/skill-builder'
import { GearsetPaneSkillStore } from './gearset-pane-skill.store'

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
  providers: [GearsetPaneSkillStore],
  host: {
    class: 'flex flex-col relative',
    '[class.screenshot-hidden]': '!instance',
  },
})
export class GearsetPaneSkillComponent {
  private db = inject(SkillBuildsDB)
  private gearDb = inject(GearsetsDB)
  private dialog = inject(Dialog)
  private injector = inject(Injector)
  private store = inject(GearsetPaneSkillStore)

  @Input()
  public set slot(value: GearsetSkillSlot) {
    patchState(this.store, { slot: value })
  }
  public get slot() {
    return this.store.slot()
  }

  @Input()
  public set gearset(value: GearsetRecord) {
    patchState(this.store, { gearset: value })
  }
  public get gearset() {
    return this.store.gearset()
  }

  @Input()
  public set compact(value: boolean) {
    patchState(this.store, { compact: value })
  }
  public get compact() {
    return this.store.compact()
  }

  @Input()
  public set disabled(value: boolean) {
    patchState(this.store, { disabled: value })
  }
  public get disabled() {
    return this.store.disabled()
  }

  protected get instance() {
    return this.store.instance()
  }

  protected get equippedTag() {
    return this.store.equippedWeaponTag()
  }

  protected iconMenu = svgEllipsisVertical
  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconReset = svgRotate
  protected iconGraph = svgDiagramProject
  protected iconPlus = svgPlus
  protected iconOpen = svgFolderOpen

  constructor() {
    effect(() => {
      const equipped = this.equippedTag
      const slotted = this.instance?.weapon
      if (!equipped || !slotted || equipped === slotted || this.disabled) {
        return
      }
      this.updateSkill({
        weapon: equipped,
        tree1: [],
        tree2: [],
      })
    })
  }

  protected updateSkill(value: SkillSet) {
    saveSkill(this.gearDb, {
      gearset: this.gearset,
      slot: this.slot,
      instance: value,
    })
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
        this.updateSkill({
          weapon: weapon.WeaponTag,
          tree1: [],
          tree2: [],
        })
      })
  }

  protected handleOpenSkillSet(weapon: string) {
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
      .pipe(switchMap((id: string) => this.db.read(id)))
      .subscribe((value) => {
        this.updateSkill({
          weapon: value.weapon,
          tree1: value.tree1,
          tree2: value.tree2,
        })
      })
  }

  protected handleReset() {
    this.updateSkill({
      weapon: this.instance?.weapon,
      tree1: [],
      tree2: [],
    })
  }
}

function saveSkill(
  db: GearsetsDB,
  options: {
    gearset: GearsetRecord
    slot: GearsetSkillSlot
    instance?: SkillSet
  },
) {
  const { gearset, slot, instance } = options
  const record = clone(gearset)
  record.skills = record.skills || {}
  if (!instance) {
    delete record.skills[slot]
  } else {
    record.skills[slot] = instance
  }
  return db.update(record.id, record)
}

function clone<T>(it: T): T {
  return JSON.parse(JSON.stringify(it))
}
