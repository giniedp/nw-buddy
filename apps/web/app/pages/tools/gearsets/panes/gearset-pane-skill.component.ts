import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, DestroyRef, Injector, computed, inject, input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Observable, combineLatest, filter, map, of, switchMap } from 'rxjs'

import { GearsetsDB, NwDataService } from '~/data'
import { NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { toObservable, toSignal } from '@angular/core/rxjs-interop'
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
  host: {
    class: 'flex flex-col relative',
    '[class.screenshot-hidden]': '!instance()',
  },
})
export class GearsetPaneSkillComponent {
  private db = inject(SkillBuildsDB)
  private gearDb = inject(GearsetsDB)
  private data = inject(NwDataService)
  private dialog = inject(Dialog)
  private injector = inject(Injector)
  private destroyRef = inject(DestroyRef)

  public readonly slot = input.required<GearsetSkillSlot>()
  public readonly gearset = input.required<GearsetRecord>()
  public readonly compact = input<boolean>(false)
  public readonly disabled = input<boolean>(false)

  protected skill = toSignal(
    loadSkill(this.db, {
      gearset: toObservable(this.gearset),
      slot: toObservable(this.slot),
    }),
  )
  protected instance = computed(() => this.skill()?.instance)

  protected iconMenu = svgEllipsisVertical
  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconReset = svgRotate
  protected iconGraph = svgDiagramProject
  protected iconPlus = svgPlus
  protected iconOpen = svgFolderOpen

  // public ngOnInit(): void {
  //   if (!this.disabled()) {
  //     this.attachAutoSwitchSkill()
  //   }
  // }

  protected updateSkill(value: SkillSet) {
    saveSkill(this.gearDb, {
      gearset: this.gearset(),
      slot: this.slot(),
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
      .pipe(switchMap((id: string) => this.db.read(id)))
      .subscribe((value) => {
        this.updateSkill({
          weapon: value.weapon,
          tree1: value.tree1,
          tree2: value.tree2,
        })
      })
  }

  protected reset() {
    this.updateSkill({
      weapon: this.skill()?.instance?.weapon,
      tree1: [],
      tree2: [],
    })
  }
}

function loadSkill(
  db: SkillBuildsDB,
  options: {
    gearset: Observable<GearsetRecord>
    slot: Observable<GearsetSkillSlot>
  },
) {
  return combineLatest(options).pipe(
    switchMap(({ gearset, slot: skillSlot }) => {
      const skillRef = gearset?.skills?.[skillSlot]
      const instanceId = typeof skillRef === 'string' ? skillRef : null
      const instance = typeof skillRef !== 'string' ? skillRef : null
      const query$ = instanceId ? db.live((t) => t.get(instanceId)) : of(instance)
      return combineLatest({
        slot: of(skillSlot),
        instance: query$,
      })
    }),
  )
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
