import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Injector,
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
import { svgCalculator, svgChartLine, svgChevronLeft, svgCodeMerge, svgGlobe, svgSwords, svgUser } from '~/ui/icons/svg'

import { BackendService } from '~/data/backend'
import { DamageCalculatorComponent } from '~/widgets/damage-calculator'
import { EmbedHeightDirective } from '../../../utils/directives'
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
  protected injector = inject(Injector)

  protected isTabOpponent = toSignal(injectQueryParam('tab').pipe(map((it) => it === 'vs')))
  protected isLarge = toSignal(injectBreakpoint('(min-width: 992px)'))

  protected userId = toSignal(injectRouteParam('userid'))
  protected id = toSignal(injectRouteParam('id'))
  protected opponentId = toSignal(injectQueryParam('vs'))

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
  protected playerIsOwned = computed(() => {
    return this.userId() === (this.backend.sessionUserId() || 'local')
  })

  protected opponentResource = rxResource({
    params: () => ({ userId: this.userId(), id: this.opponentId() }),
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
  protected hasOpponent = computed(() => !!this.opponentId())

  protected playerHost = viewChild('playerHost', { read: GearsetHostDirective })
  protected opponentHost = viewChild('opponentHost', { read: GearsetHostDirective })

  protected iconBack = svgChevronLeft
  protected iconTabMain = svgUser
  protected iconTabStats = svgChartLine
  protected iconTabSkill = svgCodeMerge
  protected iconTabGear = svgSwords
  protected iconTabCalculator = svgCalculator
  protected iconGlobe = svgGlobe

  public constructor() {
    effect(() => {
      const sessionUser = this.backend.sessionUserId()
      if (sessionUser && this.userId() === 'local') {
        this.router.navigate(['../..', sessionUser], { relativeTo: this.route })
      }
    })
    effect(() => {
      const player = this.playerHost()?.mannequin
      const opponent = this.opponentHost()?.mannequin
      untracked(() => {
        this.player.set(player || null)
        this.opponent.set(opponent || null)
      })
    })
  }

  protected handleImportClicked() {}
}
