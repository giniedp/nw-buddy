import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Output,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { Promotionmutations } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { GameModeDetailStore } from './game-mode-detail.store'
import { MutaPromotionDetailModule } from '~/widgets/data/muta-promotion-detail'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'

@Component({
  standalone: true,
  selector: 'nwb-muta-promotion-tile',
  templateUrl: './muta-promotion-tile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule, OverlayModule, MutaPromotionDetailModule],
  hostDirectives: [CdkOverlayOrigin, TooltipDirective],
  host: {
    class: 'rounded-md flex flex-row items-center gap-2 p-2 cursor-pointer',
  },
})
export class MutaPromotionTileComponent {
  private store = inject(GameModeDetailStore)
  protected cdkOrigin = inject(CdkOverlayOrigin)
  protected tip = inject(TooltipDirective)

  public selection = toSignal(this.store.mutaPromotion$)
  public options = toSignal(this.store.mutaPromotionOptions$)
  public mutaElement = toSignal(this.store.mutaElement$)

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
  public selectionChanged = new EventEmitter<Promotionmutations>()

  protected isMenuOpen = false

  @HostListener('click')
  public onClick() {
    this.isMenuOpen = true
  }

  protected select(value: Promotionmutations) {
    this.isMenuOpen = false
    this.selectionChanged.emit(value)
  }
}
