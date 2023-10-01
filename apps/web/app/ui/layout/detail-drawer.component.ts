import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Directive,
  Injector,
  Input,
  TemplateRef,
  ViewChild,
} from '@angular/core'
import { IonicModule, IonMenu, IonModal } from '@ionic/angular'
import { BehaviorSubject, combineLatest, map, merge, of, startWith, switchMap } from 'rxjs'
import { BreakpointName, BREAKPOINTS } from './breakpoints'
import { LayoutService } from './layout.service'
import { Platform } from '@angular/cdk/platform'

export class DetailDrawerContext {
  public $implicit = this
  public isModal = false
  public constructor(isModal: boolean) {
    this.isModal = isModal
  }
}

@Directive({
  standalone: true,
  selector: '[nwbDetailDrawerContent]',
})
export class DetailDrawerContent {
  public static ngTemplateContextGuard<T>(dir: DetailDrawerContent, ctx: unknown): ctx is DetailDrawerContext {
    return true
  }
  public constructor(public readonly tpl: TemplateRef<DetailDrawerContext>) {}
}

@Component({
  standalone: true,
  selector: 'nwb-detail-drawer',
  templateUrl: './detail-drawer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonicModule],
  host: {
    class: 'block overflow-hidden',
  },
})
export class DetailDrawerComponent {
  @Input()
  public set breakOn(value: BreakpointName) {
    this.breakpoint$.next(value)
  }

  @Input()
  public breakpoints: number[] = [0.15, 0.25, 0.5, 0.75]

  @Input()
  public initialBreakpoint: number = 0.15

  @Input()
  public backdropBreakpoint: number = 0.5

  @Input()
  public injector: Injector

  @Input()
  public openAlways = false

  @ViewChild(IonModal)
  protected modal: IonModal

  @ContentChild(DetailDrawerContent)
  protected content: DetailDrawerContent

  @ContentChild(TemplateRef)
  protected contentTemplate: TemplateRef<any>

  protected contextModal = new DetailDrawerContext(true)
  protected contextDefault = new DetailDrawerContext(false)

  protected get template() {
    return this.content?.tpl || this.contentTemplate
  }

  protected breakpoint$ = new BehaviorSubject<BreakpointName>('lg')
  protected isLarge$ = this.breakpoint$
    .pipe(switchMap((it) => this.layout.breakpoint.observe(`(min-width: ${BREAKPOINTS[it]})`)))
    .pipe(map((it) => it.matches))
  protected isSmall$ = this.isLarge$.pipe(map((it) => !it))
  protected shouldOpen$ = combineLatest({
    appMenuOpen: this.layout.appMenu$.pipe(switchMap((menu) => this.isMenuOpen(menu))),
    isSmall: this.isSmall$,
  }).pipe(map(({ appMenuOpen, isSmall }) => !appMenuOpen && isSmall))

  public constructor(private layout: LayoutService, injector: Injector, platform: Platform) {
    this.injector = injector
    if (platform.isBrowser) {
      this.setInitialBreakpoints()
    }
  }

  public ngOnDestroy(): void {
    this.modal.dismiss()
  }

  private isMenuOpen(menu: IonMenu) {
    if (!menu) {
      return of(false)
    }
    const open$ = menu.ionWillOpen.pipe(map(() => true))
    const close$ = menu.ionWillClose.pipe(map(() => false))
    return merge(open$, close$).pipe(startWith(false))
  }

  private setInitialBreakpoints() {
    this.breakpoints = [px2vh(12), px2vh(92), 0.45, 1]
    this.initialBreakpoint = this.breakpoints[1]
  }
}

function px2vh(px: number) {
  return px / window.innerHeight
}
