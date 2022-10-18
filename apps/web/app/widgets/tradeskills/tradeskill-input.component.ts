import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BehaviorSubject, combineLatest, defer, map } from 'rxjs'
import { NwService } from '~/nw'
import { TradeskillLevelInputModule } from '~/ui/tradeskill-level-input'
import { shareReplayRefCount } from '~/utils'

@Component({
  standalone: true,
  selector: 'nwb-tradeskill-input',
  templateUrl: './tradeskill-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, TradeskillLevelInputModule],
  host: {
    class: 'contents',
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
