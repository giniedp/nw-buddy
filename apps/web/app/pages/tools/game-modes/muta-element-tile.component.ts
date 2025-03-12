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
import { ElementalMutationStaticData } from '@nw-data/generated'
import { NwModule } from '~/nw'
import { TooltipDirective } from '~/ui/tooltip/tooltip.directive'
import { MutaElementDetailModule } from '~/widgets/data/muta-element-detail'

@Component({
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
  protected cdkOrigin = inject(CdkOverlayOrigin)
  protected tip = inject(TooltipDirective)

  @Input({ required: true })
  public mutaElement: ElementalMutationStaticData

  @Input()
  public options: Array<{ label: string; value: string; icon: string; object: ElementalMutationStaticData }>

  @HostBinding('style.background-color')
  protected get backgroundColor() {
    return `rgba(${this.mutaElement?.BackgroundColor}, 0.75)`
  }

  @HostBinding('style.color')
  protected get textColor() {
    return `rgb(${this.mutaElement?.TextColor})`
  }

  @ViewChild('tplTip')
  protected set tplTip(value: TemplateRef<unknown>) {
    this.tip.tooltip = value
    this.tip.tooltipClass = 'p-0'
  }

  @Output()
  public mutaElementChanged = new EventEmitter<ElementalMutationStaticData>()

  protected isMenuOpen = false

  @HostListener('click')
  public onClick() {
    this.isMenuOpen = this.options?.length > 0
  }

  protected select(value: ElementalMutationStaticData) {
    this.isMenuOpen = false
    this.mutaElementChanged.emit(value)
  }
}
