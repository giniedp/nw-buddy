import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ContentChild, Input, TemplateRef } from '@angular/core'

@Component({
  standalone: true,
  selector: '[nwbNavToolbarMenu]',
  template: '',

})
export class NavToobalMenuComponent {
  public constructor(public template: TemplateRef<unknown>) {
    //
  }
}

@Component({
  standalone: true,
  selector: '[nwbNavToolbarButtons]',
  template: '',
})
export class NavToobalButtonsComponent {
  public constructor(public template: TemplateRef<unknown>) {
    //
  }
}


@Component({
  standalone: true,
  selector: 'nwb-nav-toolbar',
  templateUrl: './nav-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule],
  host: {
    class: 'flex flex-row bg-base-300 overflow-hidden',
  },
})
export class NavToolbarComponent {

  protected isMenuOpen = false

  @Input()
  public menu: TemplateRef<any>

  @Input()
  public buttons: TemplateRef<any>
}
