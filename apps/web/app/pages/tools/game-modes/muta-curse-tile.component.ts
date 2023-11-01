import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, HostListener, OnInit, Output, TemplateRef, ViewChild, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Cursemutations } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { GameModeDetailStore } from './game-mode-detail.store'
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'
import { MutaCurseDetailModule } from '~/widgets/data/muta-curse-detail'

@Component({
  standalone: true,
  selector: 'nwb-muta-curse-tile',
  templateUrl: './muta-curse-tile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, OverlayModule, MutaCurseDetailModule],
  hostDirectives: [CdkOverlayOrigin, TooltipDirective],
  host: {
    class: 'rounded-md flex flex-row items-center gap-2 p-2 cursor-pointer',
  },
})
export class MutaCurseTileComponent {
  private store = inject(GameModeDetailStore)
  protected cdkOrigin = inject(CdkOverlayOrigin)
  protected tip = inject(TooltipDirective)

  public selection = toSignal(this.store.mutaCurse$)
  public options = toSignal(this.store.mutaCurseOptions$)
  public mutaElement = toSignal(this.store.mutaElement$)

  @HostBinding('style.background-color')
  protected get backgroundColor() {
    return `rgba(${this.mutaElement()?.BackgroundColor}, 0.75)`
  }

  @HostBinding('style.color')
  protected get textColor() {
    return `rgb(${this.mutaElement()?.TextColor})`
  }

  @ViewChild('tplTip')
  protected set tplTip(value: TemplateRef<unknown>) {
    this.tip.tooltip = value
    this.tip.tooltipClass = 'p-0'
  }

  @Output()
  public selectionChanged = new EventEmitter<Cursemutations>()

  protected isMenuOpen = false

  @HostListener('click')
  public onClick() {
    this.isMenuOpen = true
  }

  protected select(value: Cursemutations) {
    this.isMenuOpen = false
    this.selectionChanged.emit(value)
  }

}
