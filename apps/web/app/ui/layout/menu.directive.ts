import { Directive, HostListener, OnDestroy, OnInit } from '@angular/core'
import { IonMenu } from '@ionic/angular/standalone'
import { firstValueFrom } from 'rxjs'
import { LayoutService } from './layout.service'

@Directive({
  standalone: true,
  selector: '[nwbMenu]',
})
export class MenuConnectorDirective implements OnInit, OnDestroy {
  public constructor(
    private menu: IonMenu,
    private service: LayoutService,
  ) {
    //
  }

  public ngOnInit(): void {
    this.service.connectMenu(this.menu)
  }

  public ngOnDestroy(): void {
    this.service.disconnectMenu(this.menu)
  }
}

@Directive({
  standalone: true,
  selector: '[nwbMenuClose]',
})
export class MenuCloseDirective {
  public constructor(
    private menu: IonMenu,
    private service: LayoutService,
  ) {
    //
  }

  @HostListener('click')
  public async click() {
    const menu = await firstValueFrom(this.service.appMenu$)
    menu.close(true)
  }
}
