import { Directive, forwardRef, Input, Output } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { filter } from 'rxjs'
import { StatusEffectDetailStore } from './status-effect.store'

@Directive({
  standalone: true,
  selector: '[nwbStatusEffectDetail]',
  exportAs: 'effectDetail',
  providers: [
    {
      provide: StatusEffectDetailStore,
      useExisting: forwardRef(() => StatusEffectDetailDirective),
    },
  ],
})
export class StatusEffectDetailDirective extends StatusEffectDetailStore {
  @Input()
  public set nwbStatusEffectDetail(value: string) {
    this.load(value)
  }

  @Output()
  public nwbStatusEffectChange = toObservable(this.effect)
}
