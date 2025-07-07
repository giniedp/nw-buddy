import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterModule } from '@angular/router'
import {
  IonButtons,
  IonHeader,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonSplitPane,
} from '@ionic/angular/standalone'
import { NwModule } from '~/nw'
import { ChipsInputModule } from '~/ui/chips-input'
import { IconsModule } from '~/ui/icons'
import { LayoutModule } from '~/ui/layout'
import { TooltipModule } from '~/ui/tooltip'
import { injectBreakpoint, injectQueryParam, injectRouteParam } from '~/utils'
import { ScreenshotModule } from '~/widgets/screenshot'

import { rxResource, toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs'
import { GearsetsService } from '~/data'
import { Mannequin } from '~/nw/mannequin'
import { svgCalculator, svgChartLine, svgCodeMerge, svgSwords, svgUser } from '~/ui/icons/svg'

import { BackendService } from '~/data/backend'
import { DamageCalculatorComponent } from '~/widgets/damage-calculator'
import { GearsetGridComponent } from './gearset/gearset-grid.component'
import { GearsetHostDirective } from './gearset/gearset-host.directive'
import { GearsetToolbarComponent } from './gearset/gearset-toolbar.component'

@Component({
  selector: 'nwb-gearsets-detail-page',
  templateUrl: './gearsets-detail-page.component.html',
  imports: [
    CommonModule,
    NwModule,
    FormsModule,
    IconsModule,
    RouterModule,
    ScreenshotModule,
    TooltipModule,
    IonHeader,
    LayoutModule,
    IonSplitPane,
    IonSegment,
    IonSegmentButton,
    IonButtons,
    IonMenuButton,
    ChipsInputModule,
    OverlayModule,
    GearsetGridComponent,
    GearsetHostDirective,
    GearsetToolbarComponent,
    DamageCalculatorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ion-page',
  },
})
export class GearsetsDetailPageComponent {
  private backend = inject(BackendService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private gearsets = inject(GearsetsService)

  protected isTabOpponent = toSignal(injectQueryParam('tab').pipe(map((it) => it === 'vs')))
  protected isLarge = toSignal(injectBreakpoint('(min-width: 992px)'))

  protected userId = toSignal(injectRouteParam('userid'))
  protected id = toSignal(injectRouteParam('id'))
  protected oppenentId = toSignal(injectQueryParam('vs'))


  protected playerResource = rxResource({
    params: () => ({ userId: this.userId(), id: this.id() }),
    stream: ({ params: { userId, id } }) => {
      return this.gearsets.observeRecord({ userId, id })
    },
    defaultValue: null,
  })

  protected player = signal<Mannequin>(null)
  protected playerGearset = computed(() => {
    if (this.playerResource.hasValue()) {
      return this.playerResource.value()
    }
    return null
  })
  protected playerIsLoading = this.playerResource.isLoading
  protected playerGearsetEditable = computed(() => this.playerGearset()?.userId === this.backend.sessionUserId())

  protected opponentResource = rxResource({
    params: () => ({ userId: this.userId(), id: this.oppenentId() }),
    stream: ({ params: { userId, id } }) => {
      return this.gearsets.observeRecord({ userId, id })
    },
    defaultValue: null,
  })

  protected opponent = signal<Mannequin>(null)
  protected opponentGearset = computed(() => {
    if (this.opponentResource.hasValue()) {
      return this.opponentResource.value()
    }
    return null
  })
  protected opponentIsLoading = this.opponentResource.isLoading
  protected opponentGearsetEditable = computed(() => this.opponentGearset()?.userId === this.backend.sessionUserId())
  protected hasOpponent = computed(() => !!this.oppenentId())

  protected playerHost = viewChild('playerGrid', { read: GearsetHostDirective })
  protected opponentHost = viewChild('oponentGrid', { read: GearsetHostDirective })

  protected iconTabMain = svgUser
  protected iconTabStats = svgChartLine
  protected iconTabSkill = svgCodeMerge
  protected iconTabGear = svgSwords
  protected iconTabCalculator = svgCalculator

  public constructor() {
    effect(() => {
      const sessionUser = this.backend.sessionUserId()
      if (sessionUser && this.userId() === 'local') {
        this.router.navigate(['../..', sessionUser], { relativeTo: this.route })
      }
    })
    effect(() => {
      const playerHost = this.playerHost()
      const opponentHost = this.opponentHost()
      untracked(() => {
        this.player.set(playerHost?.mannequin || null)
        this.opponent.set(opponentHost?.mannequin || null)
      })
    })
  }
}
