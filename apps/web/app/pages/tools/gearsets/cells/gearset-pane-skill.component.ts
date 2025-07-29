import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Injector, Input, effect, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { patchState } from '@ngrx/signals'
import { filter, map } from 'rxjs'
import { GearsetRecord, GearsetSkillTreeRef, GearsetsService, SkillTreesService, SkillTree } from '~/data'
import { NwModule } from '~/nw'
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
import { ItemDetailModule } from '~/widgets/data/item-detail'
import { SkillTreeTableAdapter, SkillTreeTableRecord } from '~/widgets/data/skill-tree-table'
import { openWeaponTypePicker } from '~/widgets/data/weapon-type'
import { SkillTreeEditorModule } from '~/widgets/skill-tree'
import { GearsetPaneSkillStore } from './gearset-pane-skill.store'

@Component({
  selector: 'nwb-gearset-pane-skill',
  templateUrl: './gearset-pane-skill.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    OverlayModule,
    ItemDetailModule,
    IconsModule,
    LayoutModule,
    SkillTreeEditorModule,
    TooltipModule,
  ],
  providers: [GearsetPaneSkillStore],
  host: {
    '[class.screenshot-hidden]': '!instance',
  },
})
export class GearsetPaneSkillComponent {
  private skillService = inject(SkillTreesService)
  private gearService = inject(GearsetsService)
  private injector = inject(Injector)
  private store = inject(GearsetPaneSkillStore)

  @Input()
  public set slot(value: GearsetSkillTreeRef) {
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
      if (!this.store.equippedWeaponTag() || !this.store.instanceLoaded()) {
        return
      }
      const equipped = this.equippedTag
      const slotted = this.instance?.weapon
      if ((!equipped && !slotted) || eqCaseInsensitive(equipped, slotted) || this.disabled) {
        return
      }
      this.updateSkillTree({
        weapon: equipped,
        tree1: [],
        tree2: [],
      })
    })
  }

  protected updateSkillTree(value: SkillTree) {
    saveSkill(this.gearService, {
      gearset: this.gearset,
      slot: this.slot,
      skill: value,
    })
  }

  protected createNew() {
    openWeaponTypePicker({
      injector: this.injector,
    })
      .pipe(
        filter((it) => !!it?.length),
        map((it) => NW_WEAPON_TYPES.find((type) => type.WeaponTypeID === String(it[0]))),
      )
      .subscribe((weapon) => {
        this.updateSkillTree({
          weapon: weapon.WeaponTag,
          tree1: [],
          tree2: [],
        })
      })
  }

  protected async handleOpenSkillSet(weapon: string) {
    const result = await DataViewPicker.open<SkillTreeTableRecord>({
      title: 'Choose Skill Tree',
      selection: null,
      dataView: {
        adapter: SkillTreeTableAdapter,
        filter: (it) => eqCaseInsensitive(it.record?.weapon, weapon),
      },
      displayMode: ['grid'],
      injector: this.injector,
    }).then((ids: string[]) => {
      const id = ids?.[0]
      return id ? this.skillService.read(id) : null
    })
    if (!result) {
      return
    }
    this.updateSkillTree({
      weapon: result.weapon,
      tree1: result.tree1,
      tree2: result.tree2,
    })
  }

  protected handleReset() {
    this.updateSkillTree({
      weapon: this.instance?.weapon,
      tree1: [],
      tree2: [],
    })
  }
}

function saveSkill(
  service: GearsetsService,
  options: {
    gearset: GearsetRecord
    slot: GearsetSkillTreeRef
    skill?: SkillTree
  },
) {
  const { gearset, slot, skill } = options
  const record = clone(gearset)
  record.skills = record.skills || {}
  if (!skill) {
    delete record.skills[slot]
  } else {
    record.skills[slot] = skill
  }
  return service.update(record.id, record)
}

function clone<T>(it: T): T {
  return JSON.parse(JSON.stringify(it))
}
