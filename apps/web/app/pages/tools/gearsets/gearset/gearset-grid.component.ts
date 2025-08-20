import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
  viewChildren,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { EQUIP_SLOTS } from '@nw-data/common'
import { filter, map, switchMap } from 'rxjs'
import { GearsetSection, GearsetsService, GearsetStore, getGearsetSections } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgGlobe } from '~/ui/icons/svg'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { ScreenshotFrameDirective, ScreenshotModule } from '~/widgets/screenshot'
import { PlatformService } from '../../../../utils/services/platform.service'
import { GearCellSlotComponent } from '../cells/gear-cell-slot.component'
import { GearsetPaneMainComponent } from '../cells/gearset-pane-main.component'
import { GearsetPaneSkillComponent } from '../cells/gearset-pane-skill.component'
import { GearsetPaneStatsComponent } from '../cells/gearset-pane-stats.component'

@Component({
  selector: 'nwb-gearset-grid',
  templateUrl: './gearset-grid.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    GearCellSlotComponent,
    GearsetPaneMainComponent,
    GearsetPaneSkillComponent,
    GearsetPaneStatsComponent,
    IconsModule,
    LayoutModule,
    ScreenshotModule,
  ],
  host: {
    class: 'block @container',
  },
  hostDirectives: [
    {
      directive: ScreenshotFrameDirective,
    },
  ],
})
export class GearsetGridComponent {
  private store = inject(GearsetStore)
  private modal = inject(ModalService)
  private service = inject(GearsetsService)
  private platform = inject(PlatformService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private sections = toSignal(
    this.route.queryParamMap.pipe(
      map((it): GearsetSection[] => {
        return getGearsetSections().filter((key) => !it.has(key) || (it.get(key) !== 'false' && it.get(key) !== '0'))
      }),
    ),
  )

  public disabled = input(false)

  protected elMain = viewChild<string, ElementRef<HTMLElement>>('elMain', { read: ElementRef })
  protected elStats = viewChild<string, ElementRef<HTMLElement>>('elStats', { read: ElementRef })
  protected elSkill1 = viewChild<string, ElementRef<HTMLElement>>('elSkill1', { read: ElementRef })
  protected elSkill2 = viewChild<string, ElementRef<HTMLElement>>('elSkill2', { read: ElementRef })
  protected elGear = viewChildren<string, ElementRef<HTMLElement>>('elGear', { read: ElementRef })

  protected gearset = this.store.gearset
  protected isLoaded = this.store.isLoaded
  protected isLoading = this.store.isLoading
  protected readonly = computed(() => this.disabled() || !this.store.isOwned() || this.isEmbed())
  protected iconInfo = svgCircleExclamation
  protected iconGlobe = svgGlobe
  protected isEmbed = computed(() => this.platform.isEmbed)
  protected showItemInfo = this.store.showItemInfo
  protected showPanel1 = computed(() => this.sections().includes('panel1'))
  protected showPanel2 = computed(() => this.sections().includes('panel2'))
  protected showSkills = computed(() => this.sections().includes('skills'))
  protected showArmor = computed(() => this.sections().includes('armor'))
  protected showJewelry = computed(() => this.sections().includes('jewelry'))
  protected showWeapons = computed(() => this.sections().includes('weapons'))

  protected isOwned = this.store.isOwned
  protected slots = computed(() => {
    return EQUIP_SLOTS.filter(
      (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies',
    ).filter((it) => {
      const isArmor = it.id === 'head' || it.id === 'chest' || it.id === 'hands' || it.id === 'legs' || it.id === 'feet'
      if (!this.showArmor() && isArmor) {
        return false
      }
      const isJewelry = it.id === 'amulet' || it.id === 'earring' || it.id === 'ring'
      if (!this.showJewelry() && isJewelry) {
        return false
      }
      const isWeapon = it.id === 'weapon1' || it.id === 'weapon2' || it.id === 'weapon3' || it.id === 'heartgem'
      if (!this.showWeapons() && isWeapon) {
        return false
      }
      return true
    })
  })

  constructor(screenshot: ScreenshotFrameDirective) {
    effect(() => {
      screenshot.nwbScreenshotFrame = this.gearset()?.name
      screenshot.nwbScreenshotLabel = 'Gearset'
      screenshot.nwbScreenshotWidth = 1660
      screenshot.nwbScreenshotMode = 'detached'
    })
  }

  public scrollToMain() {
    this.elMain().nativeElement.scrollIntoView({ behavior: 'smooth' })
  }
  public scrollToStats() {
    this.elStats().nativeElement.scrollIntoView({ behavior: 'smooth' })
  }
  public scrollToSkill1() {
    this.elSkill1().nativeElement.scrollIntoView({ behavior: 'smooth' })
  }
  public scrollToSkill2() {
    this.elSkill2().nativeElement.scrollIntoView({ behavior: 'smooth' })
  }
  public scrollToGear() {
    this.elGear()[0].nativeElement.scrollIntoView({ behavior: 'smooth' })
  }

  protected screenshotName(suffix: string) {
    return `${this.gearset?.name} - ${suffix}`
  }

  protected handleImportClicked() {
    const record = this.gearset()
    PromptDialogComponent.open(this.modal, {
      inputs: {
        title: 'Import Gearset',
        body: 'Give it a name',
        value: record.name,
        positive: 'Import',
        negative: 'Cancel',
      },
    })
      .result$.pipe(filter((it) => !!it))
      .pipe(
        switchMap((newName) => {
          return this.service.dublicate({
            ...record,
            name: newName,
          })
        }),
      )
      .subscribe((record) => {
        this.router.navigate(['/gearsets', record.userId, record.id])
      })
  }
}
