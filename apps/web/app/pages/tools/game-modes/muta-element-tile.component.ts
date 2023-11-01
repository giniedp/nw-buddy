import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, HostListener, Output, TemplateRef, ViewChild, inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Elementalmutations } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { GameModeDetailStore } from './game-mode-detail.store'
import { CdkMenuModule } from '@angular/cdk/menu'
import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { MutaElementDetailModule } from '~/widgets/data/muta-element-detail'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'

@Component({
  standalone: true,
  selector: 'nwb-muta-element-tile',
  templateUrl: './muta-element-tile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, OverlayModule, MutaElementDetailModule],
  hostDirectives: [CdkOverlayOrigin, TooltipDirective],
  host: {
    class: 'rounded-md flex flex-row items-center gap-2 p-2 cursor-pointer',
  },
})
export class MutaElementTileComponent {
  private store = inject(GameModeDetailStore)
  protected cdkOrigin = inject(CdkOverlayOrigin)
  protected tip = inject(TooltipDirective)

  public selection = toSignal(this.store.mutaElement$)
  public options = toSignal(this.store.mutaElementOptions$)

  @HostBinding('style.background-color')
  protected get backgroundColor() {
    return `rgba(${this.selection()?.BackgroundColor}, 0.75)`
  }

  @HostBinding('style.color')
  protected get textColor() {
    return `rgb(${this.selection()?.TextColor})`
  }

  @ViewChild('tplTip')
  protected set tplTip(value: TemplateRef<unknown>) {
    this.tip.tooltip = value
    this.tip.tooltipClass = 'p-0'
  }

  @Output()
  public selectionChanged = new EventEmitter<Elementalmutations>()

  protected isMenuOpen = false

  @HostListener('click')
  public onClick() {
    this.isMenuOpen = true
  }

  protected select(value: Elementalmutations) {
    this.isMenuOpen = false
    this.selectionChanged.emit(value)
  }
}
