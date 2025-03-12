import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  Output,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ElementalMutationStaticData, PromotionMutationStaticData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { GameModeDetailStore } from './game-mode-detail.store'
import { MutaPromotionDetailModule } from '~/widgets/data/muta-promotion-detail'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'

@Component({
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
  protected cdkOrigin = inject(CdkOverlayOrigin)
  protected tip = inject(TooltipDirective)

  @Input({ required: true })
  public mutaPromotion: PromotionMutationStaticData

  @Input({ required: true })
  public mutaElement: ElementalMutationStaticData

  @Input()
  public options: Array<{ label: string; value: string; icon: string; object: PromotionMutationStaticData }>

  @HostBinding('style.background-color')
  protected get backgroundColor() {
    return `rgba(${this.mutaPromotion?.BackgroundColor}, 0.75)`
  }

  @HostBinding('style.color')
  protected get textColor() {
    return `rgb(${this.mutaPromotion?.TextColor})`
  }

  @ViewChild('tplTip')
  protected set tplTip(value: TemplateRef<unknown>) {
    this.tip.tooltip = value
    this.tip.tooltipClass = 'p-0'
  }

  @Output()
  public mutaPromotionChanged = new EventEmitter<PromotionMutationStaticData>()

  protected isMenuOpen = false

  @HostListener('click')
  public onClick() {
    this.isMenuOpen = this.options?.length > 0
  }

  protected select(value: PromotionMutationStaticData) {
    this.isMenuOpen = false
    this.mutaPromotionChanged.emit(value)
  }
}
