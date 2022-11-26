import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, ContentChild, Directive, Injector, Input, TemplateRef, ViewChild } from '@angular/core'
import { IonicModule, IonMenu, IonModal } from '@ionic/angular'
import { BehaviorSubject, combineLatest, map, merge, of, startWith, switchMap } from 'rxjs'
import { BreakpointName, BREAKPOINTS } from './breakpoints'
import { LayoutService } from './layout.service'

@Directive({
  standalone: true,
  selector: '[nwbDetailDraweContent]'
})
export class DetailDrawerContent {
  public constructor(public readonly tpl: TemplateRef<any>) {

  }
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

  @ViewChild(IonModal)
  protected modal: IonModal

  @ContentChild(DetailDrawerContent)
  protected content: DetailDrawerContent

  @ContentChild(TemplateRef)
  protected contentTemplate: TemplateRef<any>

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
    isSmall: this.isSmall$
  }).pipe(map(({ appMenuOpen, isSmall }) => !appMenuOpen && isSmall ))

  public constructor(private layout: LayoutService, injector: Injector) {
    this.injector = injector
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
}
