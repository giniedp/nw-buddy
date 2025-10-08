import { Directive, effect, inject, input, untracked } from '@angular/core'
import { WeaponDefinitionDetailStore } from './weapon-definition-detail.store'

@Directive({
  selector: '[nwbWeaponDefinitionDetail]',
  exportAs: 'detail',
  providers: [WeaponDefinitionDetailStore],
})
export class WeaponDefinitionDetailDirective {
  public store = inject(WeaponDefinitionDetailStore)
  public weaponId = input<string>(null, {
    alias: 'nwbWeaponDefinitionDetail',
  })

  #fxLoad = effect(() => {
    const recordId = this.weaponId()
    untracked(() => this.store.load(recordId))
  })
}
