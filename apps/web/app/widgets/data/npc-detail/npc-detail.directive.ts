import { Directive, effect, inject, input, untracked } from '@angular/core'
import { NpcDetailStore } from './npc-detail.store'

@Directive({
  selector: '[npcDetail]',
  providers: [NpcDetailStore],
})
export class NpcDetailDirective {
  public store = inject(NpcDetailStore)
  public npcId = input.required<string>({
    alias: 'npcDetail',
  })

  #fxLoad = effect(() => {
    const npcId = this.npcId()
    untracked(() => this.store.load(npcId))
  })
}
