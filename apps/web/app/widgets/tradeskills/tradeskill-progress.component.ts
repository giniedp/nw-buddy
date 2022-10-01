import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core'
import { BehaviorSubject, combineLatest, map, of, ReplaySubject, switchMap, takeUntil } from 'rxjs'
import { NwTradeskillService } from '~/nw/nw-tradeskill.service'
import { DestroyService } from '~/utils'

@Component({
  selector: 'nwb-tradeskill-progress',
  templateUrl: './tradeskill-progress.component.html',
  styleUrls: ['./tradeskill-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DestroyService]
})
export class NwTradeskillCircleComponent implements OnInit, OnChanges {
  @Input()
  public set skillName(value: string) {
    this.skillName$.next(value)
  }

  @Input()
  public set skillLevel(value: number | 'auto') {
    this.skillLevel$.next(value)
  }

  @Input()
  public set skillPoints(value: number) {
    this.skillPoint$.next(value)
  }

  public levelStart: number
  public levelEnd: number
  public levelRing: number
  public aptitudeEnd: number
  public aptitudeRing: number

  private skillName$ = new ReplaySubject<string>(1)
  private skillLevel$ = new BehaviorSubject<number | 'auto'>('auto')
  private skillPoint$ = new BehaviorSubject<number>(0)

  private skill$ = this.skills.skillByName(this.skillName$)
  private skillTable$ = this.skills.skillTableByName(this.skillName$)

  public constructor(private skills: NwTradeskillService, private destroy: DestroyService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      skill: this.skill$,
      table: this.skillTable$,
      points: this.skillPoint$,
      level: this.skillLevel$.pipe(
        switchMap((value) => {
          if (value !== 'auto') {
            return of(value)
          }
          return this.skillName$
            .pipe(switchMap((name) => this.skills.preferences.observe(name)))
            .pipe(map((data) => data?.meta?.level))
        })
      ),
    })
      .pipe(takeUntil(this.destroy.$))
      .subscribe(({ skill, table, points, level }) => {
        const progress = this.skills.calculateProgress(skill, table, level, points)
        this.levelStart = level
        this.levelEnd = Math.floor(progress.finalLevel)
        this.levelRing = Math.round((progress.finalLevel - this.levelEnd) * 100)
        this.aptitudeEnd = Math.floor(progress.aptitude)
        this.aptitudeRing = Math.round((progress.aptitude - this.aptitudeEnd) * 100)
        this.cdRef.markForCheck()
      })
  }

  public ngOnChanges(): void {
    this.cdRef.markForCheck()
  }
}
