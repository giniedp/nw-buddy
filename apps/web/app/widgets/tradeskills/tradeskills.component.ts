import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { BehaviorSubject, combineLatest, map, of, ReplaySubject, Subject, switchMap, takeUntil } from 'rxjs'
import { LocaleService } from '~/core/i18n'
import { NwService } from '~/core/nw'
import { NwTradeskillInfo } from '~/core/nw/nw-tradeskill.service'
import { TradeskillsService } from './tradeskills.service'

const COLORS = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600']

@Component({
  selector: 'nwb-tradeskills',
  templateUrl: './tradeskills.component.html',
  styleUrls: ['./tradeskills.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TradeskillsComponent implements OnInit, OnDestroy {

  @Input()
  public set category(value: string) {
    this.category$.next(value)
  }

  public chartConfig: ChartConfiguration
  private destroy$ = new Subject()

  public skills: Array<NwTradeskillInfo>
  private category$ = new ReplaySubject<string>(1)

  public constructor(private nw: NwService, private locale: LocaleService, private cdRef: ChangeDetectorRef, private service: TradeskillsService) {
    //
  }

  public ngOnInit(): void {
    combineLatest({
      locale: this.locale.change,
      skills: this.nw.tradeskills.skills,
      category: this.category$
    }).pipe(
      switchMap(({ skills, category }) => {
        const wanted = this.service.categories[category] || []
        return combineLatest(
        skills
          .filter((it) => wanted.includes(it.ID))
          .map((it) => {
          return this.nw.tradeskills.skillTableByName(of(it.ID)).pipe(
            map((table) => ({
              skill: it,
              table: table,
            }))
          )
        }))
      })
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe((data) => {
      const data0 = data[0]
      const maxLevel = data0.skill.MaxLevel
      this.skills = data.map((it) => it.skill)
      this.chartConfig = {
        type: 'line',
        options: {
          backgroundColor: '#FFF',
        },
        data: {
          labels: data0.table.filter((it) => it.Level <= maxLevel).map((it) => String(it.Level)),
          datasets: data.map((it, i) => {
            return {
              label: this.nw.translate(it.skill.Name),
              data: it.table.filter((it) => it.Level <= maxLevel).map((it) => it.MaximumInfluence),
              backgroundColor: COLORS[i % COLORS.length],
            }
          }),
        },
      }
      this.cdRef.markForCheck()
    })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public changeCategory(category: string) {
    this.category = category
    this.category$.next(category)
  }

  public readSkillLevel(id: string) {
    return this.nw.tradeskills.preferences.get(id)?.level || 0
  }

  public writeSkillLevel(id: string, value: number | string) {
    this.nw.tradeskills.preferences.merge(id, {
      level: Number(value) || 0
    })
  }
}
