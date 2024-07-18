import { Directive, Input, forwardRef } from '@angular/core'
import { NpcDetailStore } from './npc-detail.store'
import { patchState } from '@ngrx/signals'

@Directive({
  selector: '[npcDetail]',
  providers: [
    {
      provide: NpcDetailStore,
      useExisting: forwardRef(() => NpcDetailDirective),
    },
  ],
})
export class NpcDetailDirective extends NpcDetailStore {
  @Input()
  public set npcDetail(value: string) {
    patchState(this, { recordId: value })
  }
}
