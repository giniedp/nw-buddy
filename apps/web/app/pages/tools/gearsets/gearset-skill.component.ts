import { Dialog, DialogModule } from '@angular/cdk/dialog'
import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, Injector, Input, Renderer2 } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BehaviorSubject, combineLatest, filter, switchMap, tap } from 'rxjs'

import { NwModule } from '~/nw'
import { DataTableModule, DataTablePickerDialog } from '~/ui/data-table'
import { ItemDetailModule } from '~/widgets/item-detail'

import { CdkMenuModule } from '@angular/cdk/menu'
import { GearsetRecord, GearsetSkillSlot, GearsetSkillStore, SkillBuild, SkillBuildsDB, SkillBuildsStore } from '~/data'
import { IconsModule } from '~/ui/icons'
import { svgDiagramProject, svgEllipsisVertical, svgEraser, svgFolderOpen, svgLink16p, svgLinkSlash16p, svgPlus, svgTrashCan } from '~/ui/icons/svg'
import { deferStateFlat, shareReplayRefCount } from '~/utils'
import { SkillTreeModule } from '~/widgets/skill-builder'
import { TooltipModule } from '~/ui/tooltip'
import { SkillBuildsTableAdapter } from '../skill-builds/skill-builds-table.adapter'

export interface GearsetSkillVM {
  slot?: GearsetSkillSlot
  gearset?: GearsetRecord
  instance?: SkillBuild
  canRemove?: boolean
  canBreak?: boolean
}

@Component({
  standalone: true,
  selector: 'nwb-gearset-skill',
  templateUrl: './gearset-skill.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    DialogModule,
    FormsModule,
    OverlayModule,
    ItemDetailModule,
    DataTableModule,
    IconsModule,
    CdkMenuModule,
    SkillTreeModule,
    TooltipModule
  ],
  providers: [GearsetSkillStore],
  host: {
    class: 'block bg-base-100 rounded-md flex flex-col',
  },
})
export class GearsetSkillComponent {
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

  // @Output()
  // public itemRemove = new EventEmitter<void>()

  // @Output()
  // public itemUnlink = new EventEmitter<ItemInstance>()

  @Input()
  public compact: boolean

  protected iconMenu = svgEllipsisVertical
  protected iconRemove = svgTrashCan
  protected iconLink = svgLink16p
  protected iconLinkBreak = svgLinkSlash16p
  protected iconReset = svgEraser
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
    private injector: Injector,
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

  protected async breakLink() {
    // const instance = await firstValueFrom(this.store.instance$)
    // this.itemUnlink.next(instance)
  }

  protected remove() {
    this.store.updateSlot({ instance: null })
  }

  protected updateSkill(value: SkillBuild) {
    this.store.updateSlot({ instance: value })
  }

  protected loadSkill(slot: GearsetSkillSlot) {}

  protected create() {
    this.store.updateSlot({
      instance: {
        weapon: 'sword',
        tree1: [],
        tree2: [],
      },
    })
  }

  protected createExisting() {
    DataTablePickerDialog.open(this.dialog, {
      title: 'Choose Skill Tree',
      selection: null,
      adapter: SkillBuildsTableAdapter.provider({
        noActions: true
      }),
      config: {
        maxWidth: 1400,
        maxHeight: 1200,
        panelClass: ['w-full', 'h-full', 'p-4'],
        injector: Injector.create({
          parent: this.injector,
          providers: [{
            provide: SkillBuildsStore
          }]
        }),
      },
    })
    .closed
    .pipe(filter((it) => it?.length > 0))
    .pipe(switchMap((id) => this.skillsDB.read(id[0])))
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
