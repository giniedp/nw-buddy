import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { BehaviorSubject, combineLatest, defer, map, of, switchMap } from 'rxjs'
import { NwService } from '~/nw'
import { TerritoriesPreferencesService } from '~/preferences/territories-preferences.service'
import { shareReplayRefCount } from '~/utils'

@Component({
  selector: 'nwb-standing-input',
  templateUrl: './standing-input.component.html',
  styleUrls: ['./standing-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative'
  }
})
export class StandingInputComponent {
  @Input()
  public set territoryId(value: number) {
    this.territoryId$.next(value)
  }
  public get territoryId() {
    return this.territoryId$.value
  }

  public territory$ = defer(() => combineLatest({
    id: this.territoryId$,
    territories: this.nw.db.territoriesMap
  }))
    .pipe(map(({ id, territories }) => territories.get(id)))
    .pipe(shareReplayRefCount(1))

  public territoryName$ = defer(() => this.territory$)
    .pipe(map((it) => it?.NameLocalizationKey))

  public territoryImage$ = defer(() => this.territory$)
    .pipe(map((it) => {
      if (it?.TerritoryID >= 2 && it?.TerritoryID <= 15) {
        return `assets/icons/territories/mappanel_territory${it.TerritoryID}.png`
      }
      return `assets/icons/territories/mappanel_territory_default.png`
    }))

  public standingLevel$ = defer(() => this.territoryId$)
    .pipe(switchMap((id) => !id ? of(0) : this.pref.observe(id).pipe(map((it) => it?.standing || 0))))
    .pipe(shareReplayRefCount(1))

  public standingTitle$ = defer(() => combineLatest({
    level: this.standingLevel$,
    table: this.nw.db.data.territoryStanding()
  }))
    .pipe(map(({level, table}) => {
      return table.filter((it) => !!it.DisplayName && (it.Rank <= level)).reverse()[0]?.DisplayName
    }))
    .pipe(shareReplayRefCount(1))

  public get standingLevel() {
    return this.pref.get(this.territoryId)?.standing
  }
  public set standingLevel(value: number) {
    if (this.territoryId) {
      this.pref.merge(this.territoryId, {
        standing: Number(value) || 0
      })
    }
  }

  private territoryId$ = new BehaviorSubject<number>(null)

  public constructor(private nw: NwService, private pref: TerritoriesPreferencesService) {
    //
  }

}
