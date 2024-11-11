import { inject, Injectable } from '@angular/core'
import { territoryImage } from '@nw-data/common'
import { combineLatest, isObservable, map, Observable, of, switchMap } from 'rxjs'
import { injectNwData } from '~/data'
import { TerritoriesPreferencesService } from '~/preferences/territories-preferences.service'
import { shareReplayRefCount } from '~/utils'

@Injectable({ providedIn: 'root' })
export class TerritoriesService {
  private db = injectNwData()
  private pref = inject(TerritoriesPreferencesService)

  public getPreferences(id: number | Observable<number>) {
    return idStream(id).pipe(switchMap((i) => this.pref.observe(i)))
  }

  public getStanding(id: number | Observable<number>) {
    return this.getPreferences(id).pipe(map((it) => it?.standing || 0))
  }

  public getNotes(id: number | Observable<number>) {
    return this.getPreferences(id).pipe(map((it) => it?.notes || ''))
  }

  public getTags(id: number | Observable<number>) {
    return this.getPreferences(id).pipe(map((it) => it?.tags || []))
  }

  public getTerritory(id: number | Observable<number>) {
    return combineLatest({
      id: idStream(id),
      list: this.db.territoriesByIdMap(),
    }).pipe(map(({ id, list }) => list.get(id)))
  }

  public getStandingTitle(id: number | Observable<number>) {
    return combineLatest({
      level: this.getStanding(id),
      table: this.db.categoricalRankTerritoryStanding(),
    })
      .pipe(
        map(({ level, table }) => {
          return table.filter((it) => !!it.DisplayName && it.Rank <= level).reverse()[0]?.DisplayName
        }),
      )
      .pipe(shareReplayRefCount(1))
  }

  public setStanding(id: number, value: number) {
    if (id != null) {
      this.pref.merge(id, { standing: value })
    }
  }

  public setNotes(id: number, value: string) {
    if (id != null) {
      this.pref.merge(id, { notes: value })
    }
  }

  public setTags(id: number, value: string[]) {
    if (id != null) {
      this.pref.merge(id, { tags: value })
    }
  }

  public image = territoryImage
}

function idStream(id: number | Observable<number>) {
  return isObservable(id) ? id : of(id)
}
