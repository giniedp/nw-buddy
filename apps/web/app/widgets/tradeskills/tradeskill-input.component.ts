import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { combineLatest, map, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwTradeskillService } from '~/nw/tradeskill'
import { TradeskillLevelInputModule } from '~/ui/tradeskill-level-input'

@Component({
  selector: 'nwb-tradeskill-input',
  template: `
    <nwb-tradeskill-level-input
      [ngModel]="level()"
      (ngModelChange)="updateLevel(skill().ID, $event)"
      [icon]="skill().Icon"
      [label]="skill().Name"
      [maxLevel]="skill().MaxLevel"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TradeskillLevelInputModule],
  host: {
    class: 'contents',
  },
})
export class TradeskillInputComponent {
  private service = inject(NwTradeskillService)
  private character = inject(CharacterStore)

  public tradeskill = input<string>()
  private skill$ = combineLatest({
    skills: this.service.skillsMap,
    id: toObservable(this.tradeskill),
  }).pipe(map(({ skills, id }) => skills.get(id)))
  private level$ = this.skill$.pipe(switchMap((it) => this.character.observeTradeskillLevel(it.ID)))

  protected skill = toSignal(this.skill$)
  protected level = toSignal(this.level$)

  protected updateLevel(id: string, level: number) {
    this.character.setTradeskillLevel(id, level)
  }
}
