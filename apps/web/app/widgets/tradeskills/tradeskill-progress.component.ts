import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { of, switchMap } from 'rxjs'
import { CharacterStore } from '~/data'
import { NwModule } from '~/nw'
import { NwTradeskillService } from '~/nw/tradeskill'

@Component({
  selector: 'nwb-tradeskill-progress',
  template: `
    <div class="relative text-center">
      <div
        class="radial-progress text-neutral text-xs absolute top-0"
        style="--value:100; --size:4rem; --thickness: 4px;"
      ></div>
      <div
        class="radial-progress text-primary text-xs"
        [style.--value]="vars().levelRing + vars().aptitudeRing"
        style="--size:4rem; --thickness: 4px;"
      >
        <span class="italic text-base-content">{{ vars().levelStart }}</span>
        <span class="font-bold text-base-content">
          @if (vars().aptitudeRing) {
            {{ vars().levelEnd }}+{{ vars().aptitudeEnd }}
          } @else {
            {{ vars().levelEnd }}
          }
        </span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule],
  host: {
    class: 'inline-block',
  },
})
export class NwTradeskillCircleComponent {
  private skills = inject(NwTradeskillService)
  private character = inject(CharacterStore)

  public skillName = input<string>()
  public skillLevel = input<number | 'auto'>('auto')
  public skillPoints = input<number>(0)

  private skillName$ = toObservable(this.skillName)
  private skill = toSignal(this.skills.skillByName(toObservable(this.skillName)))
  private skillTable = toSignal(this.skills.skillTableByName(toObservable(this.skillName)))
  private skillLevel$ = toObservable(this.skillLevel).pipe(
    switchMap((value) => {
      if (value !== 'auto') {
        return of(value)
      }
      return this.skillName$.pipe(switchMap((name) => this.character.observeTradeskillLevel(name)))
    }),
  )
  private level = toSignal(this.skillLevel$)
  protected vars = computed(() => {
    const skill = this.skill()
    const table = this.skillTable()
    const level = this.level()
    const points = this.skillPoints()
    const progress = this.skills.calculateProgress(skill, table, level, points)
    const levelStart = level
    const levelEnd = Math.floor(progress.finalLevel)
    const levelRing = Math.round((progress.finalLevel - levelEnd) * 100)
    const aptitudeEnd = Math.floor(progress.aptitude)
    const aptitudeRing = Math.round((progress.aptitude - aptitudeEnd) * 100)
    return {
      levelStart,
      levelEnd,
      levelRing,
      aptitudeEnd,
      aptitudeRing,
    }
  })
}
