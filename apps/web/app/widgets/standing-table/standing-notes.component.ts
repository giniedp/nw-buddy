import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { NwDbService } from '~/nw'
import { TerritoriesPreferencesService } from '~/preferences/territories-preferences.service'

@Component({
  selector: 'nwb-standing-notes',
  templateUrl: './standing-notes.component.html',
  // styleUrls: ['./standing-notes.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block'
  }
})
export class StandingNotesComponent {
  @Input()
  public set territoryId(value: number) {
    this.territoryId$.next(value)
  }
  public get territoryId() {
    return this.territoryId$.value
  }

  public get text() {
    return this.pref.get(this.territoryId)?.notes || ''
  }
  public set text(value: string) {
    this.pref.merge(this.territoryId, {
      notes: value
    })
  }

  private territoryId$ = new BehaviorSubject<number>(null)

  public constructor(private db: NwDbService, private pref: TerritoriesPreferencesService) {
    //
  }

}
