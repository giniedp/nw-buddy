import { CommonModule } from '@angular/common'
import { Component, computed, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { territoryHasFort } from '@nw-data/common'
import { TerritoryDefinition } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { TerritoriesService } from '~/nw/territories'
import { ChipsInputModule } from '~/ui/chips-input'
import { TerritoryStandingComponent } from './territory-standing.component'

@Component({
  selector: 'nwb-territory-card',
  templateUrl: './territory-card.component.html',
  imports: [CommonModule, NwModule, TerritoryStandingComponent, FormsModule, ChipsInputModule],
  host: {
    class: 'flex flex-col bg-base-300 rounded-md overflow-hidden border border-base-100',
  },
})
export class TerritoryCardCoponent {
  private service = inject(TerritoriesService)
  public territory = input<TerritoryDefinition>()
  public territoryId = computed(() => this.territory()?.TerritoryID)
  protected standing = toSignal(this.service.getStanding(toObservable(this.territoryId)))
  protected standingTitle = toSignal(this.service.getStandingTitle(toObservable(this.territoryId)))
  protected notes = toSignal(this.service.getNotes(toObservable(this.territoryId)))
  protected tags = toSignal(this.service.getTags(toObservable(this.territoryId)))
  protected name = computed(() => this.territory()?.NameLocalizationKey)
  protected background = computed(() => this.service.image(this.territory(), 'territory'))
  protected hasFort = computed(() => territoryHasFort(this.territory()))
  protected level = computed(() => {
    const territory = this.territory()
    if (territory.RecommendedLevel || territory.MaximumLevel) {
      return [territory.RecommendedLevel, territory.MaximumLevel].join(' - ')
    }
    return null
  })

  protected writeNotes(id: number, note: string) {
    this.service.setNotes(id, note)
  }

  protected writeTags(id: number, value: string[]) {
    this.service.setTags(id, value)
  }
}
