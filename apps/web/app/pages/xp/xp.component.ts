import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { ChartConfiguration } from 'chart.js'
import { combineLatest, defer, map, Observable, shareReplay, Subject, takeUntil } from 'rxjs'
import { NwDataService, NwService } from '~/core/nw'

function maxLevel<T extends { Level: number }>(lvl: number) {
  return map((data: Array<T>) => data.filter((it) => it.Level <= lvl))
}

function minLevel<T extends { Level: number }>(lvl: number) {
  return map((data: Array<T>) => data.filter((it) => it.Level >= lvl))
}

function annotate<T>(name: string) {
  return map((data: T) => {
    return { name, data }
  })
}

const COLORS = [
  "#003f5c",
  "#2f4b7c",
  "#665191",
  "#a05195",
  "#d45087",
  "#f95d6a",
  "#ff7c43",
  "#ffa600",
]

interface TradeskillLevel {
  CurrencyCost:        number;
  InfluenceCost:       number;
  Level:               number;
  RecipeLevel:         number;
  RequiredLevel:       number;
  RollBonus:           number;
  SanityCheck:         boolean;
  XpReward:            number;
}

@Component({
  selector: 'nwb-xp',
  templateUrl: './xp.component.html',
  styleUrls: ['./xp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XpComponent implements OnInit, OnDestroy {
  public chartLvl: ChartConfiguration
  public chartAptitude: ChartConfiguration
  private destroy$ = new Subject()

  private crafting: Record<string, Observable<TradeskillLevel[]>> = {
    weaponsmithing: this.loader((db) => db.datatablesTradeskillweaponsmithing()),
    armoring: this.loader((db) => db.datatablesTradeskillarmoring()),
    engineering: this.loader((db) => db.datatablesTradeskillengineering()),
    jewelcrafting: this.loader((db) => db.datatablesTradeskilljewelcrafting()),
    arcana: this.loader((db) => db.datatablesTradeskillarcana()),
    cooking: this.loader((db) => db.datatablesTradeskillcooking()),
    furnishing: this.loader((db) => db.datatablesTradeskillfurnishing()),
  }

  private refining: Record<string, Observable<TradeskillLevel[]>> = {
    smelting: this.loader((db) => db.datatablesTradeskillsmelting()),
    woodworking: this.loader((db) => db.datatablesTradeskillwoodworking()),
    leatherworking: this.loader((db) => db.datatablesTradeskillleatherworking()),
    weaving: this.loader((db) => db.datatablesTradeskillweaving()),
    stonecutting: this.loader((db) => db.datatablesTradeskillstonecutting()),
  }

  private gathering: Record<string, Observable<TradeskillLevel[]>> = {
    logging: this.loader((db) => db.datatablesTradeskilllogging()),
    mining: this.loader((db) => db.datatablesTradeskillmining()),
    fishing: this.loader((db) => db.datatablesTradeskillfishing()),
    harvesting: this.loader((db) => db.datatablesTradeskillharvesting()),
    skinning: this.loader((db) => db.datatablesTradeskillskinning()),
  }

  public constructor(private nw: NwService, private cdRef: ChangeDetectorRef) {
    //
  }

  public ngOnInit(): void {
    this.update(this.crafting as any)
  }

  private update(src: Record<string, Observable<TradeskillLevel[]>>) {
    const skillKeys = Array.from(Object.keys(src))
    const skillLevels = skillKeys.map((it: keyof TradeskillLevel) => {
      return src[it].pipe(maxLevel(201), annotate(it))
    })
    const skillAptitude = skillKeys.map((it: keyof TradeskillLevel) => {
      return src[it].pipe(minLevel(202), annotate(it))
    })

    combineLatest(skillLevels)
    .pipe(
      map((data): ChartConfiguration => {

        return {
          type: 'line',
          options: {
            backgroundColor: '#FFF',
          },
          data: {
            labels: data[0].data.map((it) => String(it.Level)),
            datasets: data.map((skill, i) => {
              return {
                label: skill.name,
                data: skill.data.map((it: TradeskillLevel) => it.InfluenceCost),
                backgroundColor: COLORS[i % COLORS.length]
              }
            }),
          },
        }
      })
    )
    .pipe(takeUntil(this.destroy$))
    .subscribe((config) => {
      this.chartLvl = config
      this.cdRef.markForCheck()
    })

    combineLatest(skillAptitude)
      .pipe(
        map((data): ChartConfiguration => {

          return {
            type: 'line',
            options: {
              backgroundColor: '#FFF',
            },
            data: {
              labels: data[0].data.map((it) => String(it.Level )),
              datasets: data.map((skill, i) => {
                return {
                  label: skill.name,
                  data: skill.data.map((it) => it.InfluenceCost),
                  backgroundColor: COLORS[i % COLORS.length]
                }
              }),
            },
          }
        })
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => {
        this.chartAptitude = config
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  private loader(fn: (db: NwDataService) => Observable<TradeskillLevel[]>) {
    return defer<Observable<TradeskillLevel[]>>(() => fn(this.nw.db.data)).pipe(shareReplay(1))
  }
}
