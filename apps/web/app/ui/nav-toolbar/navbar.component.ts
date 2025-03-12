import { OverlayModule } from '@angular/cdk/overlay'
import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ContentChild, Directive, Input, TemplateRef } from '@angular/core'
import { IconsModule } from '../icons'
import { svgEllipsisVertical } from '../icons/svg'
import { CdkMenuModule } from '@angular/cdk/menu'

export class NavbarContext {
  $implicit: NavbarContext = this
  isMenuOpen: boolean
  isVertical: boolean
  isHorizontal: boolean

  public constructor({ isVertical }: { isVertical: boolean }) {
    this.isVertical
    this.isHorizontal = !isVertical
  }
}

@Directive({
  standalone: true,
  selector: '[nwbNavbarMenu]',
})
export class NavbarMenuDirective {
  public constructor(public template: TemplateRef<NavbarContext>) {
    //
  }

  public static ngTemplateContextGuard<T>(dir: NavbarMenuDirective, ctx: unknown): ctx is NavbarContext {
    return true
  }
}

@Directive({
  standalone: true,
  selector: '[nwbNavbarButtons]',
})
export class NavbarButtonsDirective {
  public constructor(public template: TemplateRef<NavbarContext>) {
    //
  }

  public static ngTemplateContextGuard<T>(dir: NavbarButtonsDirective, ctx: unknown): ctx is NavbarContext {
    return true
  }
}

@Component({
  selector: 'nwb-navbar',
  templateUrl: './navbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, OverlayModule, IconsModule, CdkMenuModule],
  host: {
    class: 'flex flex-row overflow-hidden',
  },
})
export class NavbarComponent {
  protected isMenuOpen = false
  protected svgEllipsisVertical = svgEllipsisVertical

  protected ctxHorizontal = new NavbarContext({ isVertical: false })
  protected ctxVertical = new NavbarContext({ isVertical: true })

  @Input()
  public menu: TemplateRef<NavbarContext>

  @Input()
  public buttons: TemplateRef<NavbarContext>

  @ContentChild(NavbarMenuDirective)
  protected menuDir: NavbarMenuDirective

  @ContentChild(NavbarButtonsDirective)
  protected buttonsDir: NavbarButtonsDirective

  protected get menuTemplate() {
    return this.menuDir?.template ?? this.menu
  }

  protected get buttonsTemplate() {
    return this.buttonsDir?.template ?? this.buttons
  }

  public toggleMenu() {
    this.setMenuOpen(!this.isMenuOpen)
  }

  public closeMenu() {
    this.setMenuOpen(false)
  }

  public openMenu() {
    this.setMenuOpen(true)
  }

  private setMenuOpen(isOpen: boolean) {
    this.isMenuOpen = isOpen
    this.ctxHorizontal.isMenuOpen = isOpen
    this.ctxVertical.isMenuOpen = isOpen
  }
}
