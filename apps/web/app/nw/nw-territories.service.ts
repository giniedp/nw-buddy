import { Injectable } from '@angular/core'
import { Territorydefinitions } from '@nw-data/types'
import { combineLatest, isObservable, map, Observable, of, switchMap } from 'rxjs'
import { TerritoriesPreferencesService } from '~/preferences/territories-preferences.service'
import { shareReplayRefCount } from '~/utils'
import { NwDbService } from './nw-db.service'
import { territoryImage } from './utils'


@Injectable({ providedIn: 'root' })
export class TerritoriesService {

  public constructor(private db: NwDbService, private pref: TerritoriesPreferencesService) {
    //
  }

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
      list: this.db.territoriesMap,
    })
    .pipe(map(({ id, list }) => list.get(id)))
  }

  public getStandingTitle(id: number | Observable<number>) {
    return combineLatest({
      level: this.getStanding(id),
      table: this.db.data.territoryStanding()
    })
      .pipe(map(({ level, table }) => {
        return table.filter((it) => !!it.DisplayName && (it.Rank <= level)).reverse()[0]?.DisplayName
      }))
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
