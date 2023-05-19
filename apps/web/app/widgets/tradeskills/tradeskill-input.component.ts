import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BehaviorSubject, combineLatest, defer, map, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwTradeskillService } from '~/nw/tradeskill'
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

  private id$ = new BehaviorSubject<string>(null)
  protected readonly tradeskill$ = defer(() =>
    combineLatest({
      skills: this.service.skillsMap,
      id: this.id$,
    })
  )
    .pipe(map(({ skills, id }) => skills.get(id)))
    .pipe(shareReplayRefCount(1))
  protected level$ = this.tradeskill$.pipe(
    switchMap((it) => {
      return this.char.selectTradeSkillLevel(it.ID)
    })
  )

  constructor(private service: NwTradeskillService, private char: CharacterStore) {
    //
  }

  protected updateLevel(id: string, level: number) {
    this.char.updateSkillLevel({ skill: id, level: level })
  }
}
