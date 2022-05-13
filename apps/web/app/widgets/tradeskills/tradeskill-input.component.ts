import { Component, ChangeDetectionStrategy, Input } from '@angular/core'
import { BehaviorSubject, combineLatest, defer, map } from 'rxjs'
import { NwService } from '~/core/nw'
import { shareReplayRefCount } from '~/core/utils'

@Component({
  selector: 'nwb-tradeskill-input',
  templateUrl: './tradeskill-input.component.html',
  styleUrls: ['./tradeskill-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'bg-base-100 shadow-xl rounded-md aspect-square flex flex-col',
  },
})
export class TradeskillInputComponent {
  @Input()
  public set tradeskill(value: string) {
    this.id$.next(value)
  }

  public readonly tradeskill$ = defer(() =>
    combineLatest({
      skills: this.nw.tradeskills.skillsMap,
      id: this.id$,
    })
  )
    .pipe(map(({ skills, id }) => skills.get(id)))
    .pipe(shareReplayRefCount(1))


  public get level() {
    return this.nw.tradeskills.preferences.get(this.id$.value)?.level || 0
  }
  public set level(value: number) {
    this.nw.tradeskills.preferences.merge(this.id$.value, {
      level: Number(value) || 0,
    })
  }

  private id$ = new BehaviorSubject<string>(null)

  constructor(private nw: NwService) {
    //
  }

}
