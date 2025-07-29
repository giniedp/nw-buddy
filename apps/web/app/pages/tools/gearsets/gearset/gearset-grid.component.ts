import { animate, animateChild, query, stagger, style, transition, trigger } from '@angular/animations'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  viewChild,
  viewChildren,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { EQUIP_SLOTS } from '@nw-data/common'
import { GearsetsService, GearsetStore } from '~/data'
import { NwModule } from '~/nw'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgGlobe } from '~/ui/icons/svg'
import { LayoutModule, ModalService, PromptDialogComponent } from '~/ui/layout'
import { ScreenshotFrameDirective, ScreenshotModule } from '~/widgets/screenshot'
import { GearCellSlotComponent } from '../cells/gear-cell-slot.component'
import { GearsetPaneMainComponent } from '../cells/gearset-pane-main.component'
import { GearsetPaneSkillComponent } from '../cells/gearset-pane-skill.component'
import { GearsetPaneStatsComponent } from '../cells/gearset-pane-stats.component'
import { filter, switchMap } from 'rxjs'
import { Router } from '@angular/router'

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
  private store = inject(GearsetStore)
  private modal = inject(ModalService)
  private service = inject(GearsetsService)
  private router = inject(Router)

  public disabled = input(false)

  protected elMain = viewChild<string, ElementRef<HTMLElement>>('elMain', { read: ElementRef })
  protected elStats = viewChild<string, ElementRef<HTMLElement>>('elStats', { read: ElementRef })
  protected elSkill1 = viewChild<string, ElementRef<HTMLElement>>('elSkill1', { read: ElementRef })
  protected elSkill2 = viewChild<string, ElementRef<HTMLElement>>('elSkill2', { read: ElementRef })
  protected elGear = viewChildren<string, ElementRef<HTMLElement>>('elGear', { read: ElementRef })

  protected gearset = this.store.gearset
  protected isLoaded = this.store.isLoaded
  protected isLoading = this.store.isLoading
  protected readonly = computed(() => this.disabled() || !this.store.isOwned())
  protected iconInfo = svgCircleExclamation
  protected iconGlobe = svgGlobe
  protected isEmbed = computed(() => this.router.url.includes('embed'))
  protected showItemInfo = this.store.showItemInfo
  protected isOwned = this.store.isOwned
  protected slots = computed(() => {
    return EQUIP_SLOTS.filter(
      (it) => it.itemType !== 'Consumable' && it.itemType !== 'Ammo' && it.itemType !== 'Trophies',
    )
  })

  constructor(screenshot: ScreenshotFrameDirective) {
    effect(() => {
      screenshot.nwbScreenshotFrame = this.gearset()?.name
      screenshot.nwbScreenshotLabel = 'Full Gearset'
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
