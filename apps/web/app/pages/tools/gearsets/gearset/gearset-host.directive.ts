import { Directive, computed, inject, input } from '@angular/core'
import { CharacterStore, GearsetRecord, GearsetStore } from '~/data'
import { NwTextContextService } from '~/nw/expression'
import { Mannequin } from '~/nw/mannequin'

export type GearsetMode = 'player' | 'opponent'

@Directive({
  selector: '[nwbGearsetHost]',
  standalone: true,
  providers: [GearsetStore, Mannequin, NwTextContextService],
  exportAs: 'gearsetHost',
})
export class GearsetHostDirective {
  public isLoading = input<boolean>(false)
  public gearset = input<GearsetRecord>()
  public opponent = input<GearsetRecord>()
  public showCalculator = computed(() => {
    return this.store.showCalculator() || !!this.opponent()
  })

  private store = inject(GearsetStore)
  private character = inject(CharacterStore)
  public readonly mannequin = inject(Mannequin)

  public constructor() {
    this.store.connectIsLoading(this.isLoading)
    this.store.connectGearset(this.gearset)
    this.store.connectLevel(this.character.level)
    this.store.connectToMannequin(this.mannequin)
  }
}
