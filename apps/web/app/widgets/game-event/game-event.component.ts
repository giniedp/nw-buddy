import { CommonModule } from "@angular/common"
import { Component, Input } from "@angular/core"
import { BehaviorSubject, defer, of, switchMap } from "rxjs"
import { NwDbService } from "~/core/nw"
import { shareReplayRefCount } from "~/core/utils"


@Component({
  selector: 'nwb-game-event',
  templateUrl: './game-event.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class GameEventComponent {

  @Input()
  public set eventId(value: string) {
    this.eventId$.next(value)
  }

  protected event = defer(() => this.eventId$)
    .pipe(switchMap((it) => !it ? of(null) : this.db.gameEvent(it)))
    .pipe(shareReplayRefCount(1))

  private eventId$ = new BehaviorSubject(null)

  public constructor(private db: NwDbService) {
    //
  }
}
