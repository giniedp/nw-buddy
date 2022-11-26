import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ContentChild, Input, TemplateRef } from '@angular/core'
import { IconsModule } from '../icons'
import { svgEllipsisVertical } from '../icons/svg'

@Component({
  standalone: true,
  selector: '[nwbNavToolbarMenu]',
  template: '',

})
export class NavToolbarMenuComponent {
  public constructor(public template: TemplateRef<unknown>) {
    //
  }
}

@Component({
  standalone: true,
  selector: '[nwbNavToolbarButtons]',
  template: '',
})
export class NavToolbarButtonsComponent {
  public constructor(public template: TemplateRef<unknown>) {
    //
  }
}


@Component({
  standalone: true,
  selector: 'nwb-nav-toolbar',
  templateUrl: './nav-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule, IconsModule],
  host: {
    class: 'flex flex-row overflow-hidden',
  },
})
export class NavToolbarComponent {

  protected isMenuOpen = false
  protected svgEllipsisVertical = svgEllipsisVertical

  @Input()
  public menu: TemplateRef<any>

  @Input()
  public buttons: TemplateRef<any>
}
