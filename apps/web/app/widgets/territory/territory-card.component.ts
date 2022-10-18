import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Territorydefinitions } from '@nw-data/types'
import { BehaviorSubject, combineLatest, defer, map, startWith } from 'rxjs'
import { NwModule, TerritoriesService } from '~/nw'
import { territoryHasFort } from '~/nw/utils'
import { ChipsInputModule } from '~/ui/chips-input'
import { shareReplayRefCount } from '~/utils'
import { TerritoryStandingComponent } from './territory-standing.component'

@Component({
  selector: 'nwb-territory-card',
  standalone: true,
  templateUrl: './territory-card.component.html',
  imports: [CommonModule, NwModule, TerritoryStandingComponent, FormsModule, ChipsInputModule],
  host: {
    class: 'flex flex-col bg-base-200 rounded-md overflow-hidden',
  },
})
export class TerritoryCardCoponent {
  @Input()
  public set territory(value: Territorydefinitions) {
    this.territoryId = value?.TerritoryID
  }

  @Input()
  public set territoryId(value: number) {
    this.territoryId$.next(value)
  }
  public get territoryId() {
    return this.territoryId$.value
  }

  protected vm$ = defer(() => combineLatest({
    id: this.territoryId$,
    territory: this.territory$,
    standing: this.service.getStanding(this.territoryId$),
    standingTitle: this.service.getStandingTitle(this.territoryId$),
    notes: this.service.getNotes(this.territoryId$),
    tags: this.service.getTags(this.territoryId$),
    name: this.territory$.pipe(map((it) => it?.NameLocalizationKey)),
    background: this.territory$.pipe(map((it) => this.service.image(it, 'territory'))),
    hasFort: this.territory$.pipe(map((it) => territoryHasFort(it))),
    level: this.territory$.pipe(map((it) => {
      if (it.RecommendedLevel || it.MaximumLevel) {
        return [it.RecommendedLevel, it.MaximumLevel].join(' - ')
      }
      return null
    }))
  }))
  .pipe(startWith(null))

  protected territoryId$ = new BehaviorSubject<number>(null)
  protected territory$ = defer(() => this.service.getTerritory(this.territoryId$)).pipe(shareReplayRefCount(1))

  public constructor(private service: TerritoriesService) {
    //
  }

  protected writeNotes(id: number, note: string) {
    this.service.setNotes(id, note)
  }

  protected writeTags(id: number, value: string[]) {
    this.service.setTags(id, value)
  }
}
