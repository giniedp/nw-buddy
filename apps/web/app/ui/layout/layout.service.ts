import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'
import { Injectable } from '@angular/core'
import { BehaviorSubject, defer } from 'rxjs'
import { IonMenu } from '@ionic/angular'

@Injectable({ providedIn: 'root' })
export class LayoutService {

  public get isHandset() {
    return this.breakpoint.isMatched(Breakpoints.Handset)
  }

  public appMenu$ = defer(() => this.appMenu)
  private appMenu = new BehaviorSubject<IonMenu>(null)

  public constructor(public breakpoint: BreakpointObserver) {
    console.log(Breakpoints)
  }

  public connectMenu(menu: IonMenu) {
    this.appMenu.next(menu)
  }

  public disconnectMenu(menu: IonMenu) {
    if (this.appMenu.value === menu) {
      this.appMenu.next(null)
    }
  }
}
