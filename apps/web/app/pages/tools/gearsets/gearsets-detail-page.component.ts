import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { AfterViewInit, ChangeDetectionStrategy, Component, QueryList, ViewChildren, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import {
  IonButtons,
  IonHeader,
  IonLabel,
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

import { toSignal } from '@angular/core/rxjs-interop'
import { BehaviorSubject, map } from 'rxjs'
import { GearsetsDB } from '~/data'
import { Mannequin } from '~/nw/mannequin'
import { svgCalculator, svgChartLine, svgDiagramProject, svgSwords, svgUser } from '~/ui/icons/svg'

import { DamageCalculatorComponent } from '~/widgets/damage-calculator'
import { GearsetGridComponent } from './gearset/gearset-grid.component'
import { GearsetHostDirective } from './gearset/gearset-host.directive'
import { GearsetToolbarComponent } from './gearset/gearset-toolbar.component'

@Component({
  standalone: true,
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
    IonLabel,
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
export class GearsetsDetailPageComponent implements AfterViewInit {
  protected isTabOpponent = toSignal(injectQueryParam('tab').pipe(map((it) => it === 'vs')))
  protected isLarge = toSignal(injectBreakpoint('(min-width: 992px)'))

  protected gearsetId$ = injectRouteParam('id')
  protected oppenentId$ = injectQueryParam('vs')
  protected hasOpponent = toSignal(this.oppenentId$.pipe(map((it) => !!it)))

  protected playerGeasrset = toSignal(inject(GearsetsDB).observeByid(this.gearsetId$))
  protected player$ = new BehaviorSubject<Mannequin>(null)

  protected opponentGearset = toSignal(inject(GearsetsDB).observeByid(this.oppenentId$))
  protected opponent$ = new BehaviorSubject<Mannequin>(null)

  @ViewChildren(GearsetHostDirective)
  protected players: QueryList<GearsetHostDirective>

  protected iconTabMain = svgUser
  protected iconTabStats = svgChartLine
  protected iconTabSkill = svgDiagramProject
  protected iconTabGear = svgSwords
  protected iconTabCalculator = svgCalculator

  public ngAfterViewInit(): void {
    this.players.changes.subscribe(() => {
      this.players.forEach((it) => {
        if (it.mode === 'player') {
          this.player$.next(it.mannequin)
        }
        if (it.mode === 'opponent') {
          this.opponent$.next(it.mannequin)
        }
      })
    })
    this.players.notifyOnChanges()
  }
}
