import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ContentChild, TemplateRef } from '@angular/core'

@Component({
  standalone: true,
  selector: '[nwbTabMenu]',
  template: '',

})
export class TabMenuContent {
  public constructor(public template: TemplateRef<unknown>) {
    //
  }
}

@Component({
  standalone: true,
  selector: 'nwb-tab-menu',
  templateUrl: './tab-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule],
  host: {
    class: 'flex flex-row bg-base-300 overflow-hidden',
  },
})
export class TabMenuComponent {

  protected isMenuOpen = false
  @ContentChild(TemplateRef)
  protected content: TemplateRef<unknown>
}
