import { Directive, forwardRef, Input, Output } from '@angular/core'
import { AppearanceDetailStore } from './appearance-detail.store'

@Directive({
  standalone: true,
  selector: '[nwbAppearanceDetail]',
  exportAs: 'appearanceDetail',
  providers: [
    {
      provide: AppearanceDetailStore,
      useExisting: forwardRef(() => AppearanceDetailDirective),
    },
  ],
})
export class AppearanceDetailDirective extends AppearanceDetailStore {
  @Input()
  public set nwbAppearanceDetail(value: string) {
    this.patchState({ appearanceId: value })
  }

  @Output()
  public nwbAppearanceChange = this.appearance$
}
