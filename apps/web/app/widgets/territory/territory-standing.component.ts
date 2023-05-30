import { CommonModule } from '@angular/common'
import { Component, Input } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Territorydefinitions } from '@nw-data/generated'
import { BehaviorSubject, defer, switchMap } from 'rxjs'
import { NwModule } from '~/nw'
import { TerritoriesService } from '~/nw/territories'

@Component({
  selector: 'nwb-territory-standing',
  standalone: true,
  templateUrl: './territory-standing.component.html',
  exportAs: 'nwbTerritoryStanding',
  imports: [FormsModule, CommonModule, NwModule],
  host: {
    class: 'inline-block w-16 h-16 relative',
  },
})
export class TerritoryStandingComponent {
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

  @Input()
  public set readonly(value: boolean) {
    this.isReadonly = value
  }
  public get readonly() {
    return this.isReadonly || !this.territoryId
  }

  protected value = defer(() => this.territoryId$).pipe(switchMap((id) => this.service.getStanding(id)))

  private isReadonly: boolean = false
  private territoryId$ = new BehaviorSubject<number>(null)

  public constructor(private service: TerritoriesService) {
    //
  }

  protected setValue(value: number) {
    this.service.setStanding(this.territoryId$.value, value)
  }
}
