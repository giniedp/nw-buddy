import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core'
import { Elementalmutations, GameEvent, Gamemodes, ItemDefinitionMaster, Mutationdifficulty } from '@nw-data/types'
import { combineLatest, Subject, takeUntil } from 'rxjs'
import { NwService } from '~/core/nw'
import { DungeonsService } from './dungeons.service'

export interface MutationdifficultyRow {
  difficulty: Mutationdifficulty
  rewards: Array<{
    event: GameEvent
    item: ItemDefinitionMaster
  }>
}

@Component({
  selector: 'nwb-dungeons',
  templateUrl: './dungeons.component.html',
  styleUrls: ['./dungeons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nwb-page has-menu has-detail',
  },
})
export class DungeonsComponent implements OnInit, OnDestroy {

  public get dungeon$() {
    return this.service.dungeon$
  }

  public items: Gamemodes[]
  public mutations: Elementalmutations[]
  public difficulties: MutationdifficultyRow[]

  private destroy$ = new Subject()

  public constructor(private nw: NwService, private service: DungeonsService, private cdRef: ChangeDetectorRef) {}

  public ngOnInit(): void {
    combineLatest({
      mutations: this.nw.db.data.gamemodemutatorsElementalmutations(),
      difficulty: this.nw.db.data.gamemodemutatorsMutationdifficulty(),
      modes: this.nw.db.data.gamemodes(),
      events: this.nw.db.gameEventsMap,
      items: this.nw.db.itemsMap,
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ mutations, difficulty, modes, events, items }) => {
        this.items = modes.filter((it) => it.IsDungeon)
        this.mutations = mutations
        this.difficulties = this.buildDifficultyTable(difficulty, events, items)
        this.cdRef.markForCheck()
      })
  }

  public ngOnDestroy(): void {
    this.destroy$.next(null)
    this.destroy$.complete()
  }

  public dungeonName(item: Gamemodes) {
    return this.nw.translate(item.DisplayName)
  }

  public dungeonDescription(item: Gamemodes) {
    return this.nw.translate(item.Description)
  }

  public dropIds(item: Gamemodes) {
    return item.PossibleItemDropIds?.split(',')
  }

  private buildDifficultyTable(
    difficulty: Mutationdifficulty[],
    events: Map<string, GameEvent>,
    items: Map<string, ItemDefinitionMaster>
  ): Array<MutationdifficultyRow> {
    return difficulty.map<MutationdifficultyRow>((it) => {
      const cEvents = [
        events.get(it.CompletionEvent1),
        events.get(it.CompletionEvent2),
        events.get(it.CompletionEvent3),
      ]
      return {
        difficulty: it,
        rewards: cEvents.map((event) => ({
          event: event,
          item: items.get(event?.ItemReward),
        })),
      }
    })
  }
}
