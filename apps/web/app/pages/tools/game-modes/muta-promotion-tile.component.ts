import { CdkOverlayOrigin, OverlayModule } from '@angular/cdk/overlay'
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  TemplateRef,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core'
import { ElementalMutationStaticData, PromotionMutationStaticData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'
import { MutaPromotionDetailModule } from '~/widgets/data/muta-promotion-detail'

@Component({
  selector: 'nwb-muta-promotion-tile',
  templateUrl: './muta-promotion-tile.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NwModule, OverlayModule, MutaPromotionDetailModule],
  hostDirectives: [CdkOverlayOrigin, TooltipDirective],
  host: {
    class: 'rounded-md flex flex-row items-center gap-2 p-2 cursor-pointer',
    '[style.background-color]': 'backgroundColor()',
    '[style.color]': 'textColor()',
  },
})
export class MutaPromotionTileComponent {
  protected cdkOrigin = inject(CdkOverlayOrigin)
  protected tip = inject(TooltipDirective)

  public mutaPromotion = input.required<PromotionMutationStaticData>()
  public mutaElement = input.required<ElementalMutationStaticData>()
  public options = input<Array<{ label: string; value: string; icon: string; object: PromotionMutationStaticData }>>()

  protected backgroundColor = computed(() => `rgba(${this.mutaPromotion()?.BackgroundColor}, 0.75)`)
  protected textColor = computed(() => `rgba(${this.mutaPromotion()?.TextColor}, 0.75)`)

  @ViewChild('tplTip')
  protected set tplTip(value: TemplateRef<unknown>) {
    this.tip.tooltip = value
    this.tip.tooltipClass = 'p-0'
  }

  public mutaPromotionChanged = output<PromotionMutationStaticData>()

  protected isMenuOpen = signal(false)

  @HostListener('click')
  public onClick() {
    this.isMenuOpen.set(this.options?.length > 0)
  }

  protected select(value: PromotionMutationStaticData) {
    this.isMenuOpen.set(false)
    this.mutaPromotionChanged.emit(value)
  }
}
