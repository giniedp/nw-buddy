import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Injector, Input, Renderer2 } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BehaviorSubject, combineLatest, filter, map, switchMap, tap } from 'rxjs'

import { NwModule } from '~/nw'
import { ItemDetailModule } from '~/widgets/data/item-detail'

import { GearsetRecord, GearsetSkillSlot, GearsetSkillStore, SkillBuild, SkillBuildsDB } from '~/data'
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
import { deferStateFlat, shareReplayRefCount } from '~/utils'
import { SkillsetTableAdapter } from '~/widgets/data/skillset-table'
import { SkillTreeModule } from '~/widgets/skill-builder'
import { openWeaponTypePicker } from '~/widgets/data/weapon-type'
import { NW_WEAPON_TYPES } from '~/nw/weapon-types'

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
    class: 'block flex flex-col',
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

  protected vm$ = deferStateFlat<GearsetSkillVM>(() =>
    combineLatest({
      slot: this.slot$,
      gearset: this.gearset$,
      instance: this.store.instance$,
      canRemove: this.store.canRemove$,
      canBreak: this.store.canBreak$,
    })
  )
    .pipe(
      tap((it) => {
        if (it?.instance) {
          this.renderer.removeClass(this.elRef.nativeElement, 'screenshot-hidden')
        } else {
          this.renderer.addClass(this.elRef.nativeElement, 'screenshot-hidden')
        }
      })
    )
    .pipe(shareReplayRefCount(1))

  private slot$ = new BehaviorSubject<GearsetSkillSlot>(null)
  private gearset$ = new BehaviorSubject<GearsetRecord>(null)

  public constructor(
    private store: GearsetSkillStore,
    private skillsDB: SkillBuildsDB,
    private renderer: Renderer2,
    private elRef: ElementRef<HTMLElement>,
    private dialog: Dialog,
    private injector: Injector
  ) {
    //
  }

  public ngOnInit(): void {
    this.store.useSlot(
      combineLatest({
        gearset: this.gearset$,
        slot: this.slot$,
      })
    )
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
        map((it) => NW_WEAPON_TYPES.find((type) => type.WeaponTypeID === String(it[0])))
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

  protected openExisting() {
    DataViewPicker.open(this.dialog, {
      title: 'Choose Skill Tree',
      selection: null,
      dataView: {
        adapter: SkillsetTableAdapter,
      },
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
}
