import { Component, inject, input } from '@angular/core'
import { toObservable, toSignal } from '@angular/core/rxjs-interop'
import { FormsModule } from '@angular/forms'
import { switchMap } from 'rxjs'
import { NwModule } from '~/nw'
import { TerritoriesService } from '~/nw/territories'

@Component({
  selector: 'nwb-territory-standing',
  template: `
    <img
      [nwImage]="'assets/icons/territories/icon_territorystanding.png'"
      class="object-cover absolute top-0 left-0 w-full h-full pointer-events-none scale-125"
    />
    <input
      [disabled]="readonly() || !territoryId()"
      [ngModel]="value()"
      (ngModelChange)="setValue($event)"
      type="number"
      min="0"
      placeholder="0"
      class="input input-ghost bg-transparent focus:bg-transparent h-full w-full p-0 text-center text-2xl appearance-none relative z-10 text-base-100 font-medium transition-all outline-4 outline-transparent focus:outline-primary hover:outline-primary"
    />
  `,
  exportAs: 'nwbTerritoryStanding',
  imports: [FormsModule, NwModule],
  host: {
    class: 'inline-block w-16 h-16 relative',
  },
})
export class TerritoryStandingComponent {
  private service = inject(TerritoriesService)
  public territoryId = input<number>()
  public readonly = input<boolean>()

  protected value = toSignal(toObservable(this.territoryId).pipe(switchMap((id) => this.service.getStanding(id))))
  protected setValue(value: number) {
    this.service.setStanding(this.territoryId(), value)
  }
}
