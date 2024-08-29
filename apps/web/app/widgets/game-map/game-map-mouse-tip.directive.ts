import { Directive, OnDestroy, OnInit, TemplateRef, inject } from '@angular/core'
import { GameMapHost } from './game-map-host'

@Directive({
  standalone: true,
  selector: '[nwbGameMapMouseTip]',
})
export class GameMapMouseTipDirective implements OnInit, OnDestroy {
  private host = inject(GameMapHost)
  public template = inject(TemplateRef<any>)

  public ngOnInit() {
    this.host.addTooltip(this.template)
  }

  public ngOnDestroy() {
    this.host.removeTooltip(this.template)
  }
}
