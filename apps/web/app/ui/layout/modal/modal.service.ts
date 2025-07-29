import { Injectable, Injector, InputSignal, ModelSignal, TemplateRef, Type, inject } from '@angular/core'
import { LoadingController, LoadingOptions, ModalController, ModalOptions, ToastController, ToastOptions } from '@ionic/angular/standalone'
import { Subject, from, takeUntil } from 'rxjs'
import { ModalComponent } from './modal.component'
import { FullscreenService } from '../fullscreen.service'

export type ModalSize =
  | 'auto'
  | 'fill'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'x-xs'
  | 'x-sm'
  | 'x-md'
  | 'x-lg'
  | 'y-xs'
  | 'y-sm'
  | 'y-md'
  | 'y-lg'
  | 'y-auto'
export interface ModalOpenOptions<T> extends Omit<ModalOptions, 'component' | 'componentProps'> {
  content?: TemplateRef<T> | Type<T>
  inputs?: Partial<ComponentInputs<T>>
  context?: T
  injector?: Injector
  size?: ModalSize | ModalSize[]
}

export type ComponentInputs<C> = Partial<{
  [P in keyof C]: C[P] extends InputSignal<infer T> ? T : C[P] extends ModelSignal<infer T> ? T : C[P]
}>

@Injectable({ providedIn: 'root' })
export class ModalService {
  protected injector = inject(Injector)
  protected ctrl = inject(ModalController)
  protected toast = inject(ToastController)
  private loading = inject(LoadingController)

  public open<T, R>(options: ModalOpenOptions<T>) {
    options = { ...options }
    const close$ = new Subject<R>()
    const modalRef = new ModalRef(close$)
    const injector = Injector.create({
      providers: [
        { provide: ModalRef, useValue: modalRef },
        { provide: ModalController, useFactory: () => new ModalController() },
      ],
      parent: options.injector || this.injector,
    })
    const fullscreen = injector.get(FullscreenService)
    const ctrl = injector.get(ModalController)
    const props = {
      content: options.content,
      inputs: options.inputs,
      context: options.context,
      injector: options.injector,
    } satisfies ComponentInputs<ModalComponent>

    let size = options.size ?? []
    size = Array.isArray(size) ? size : [size]
    const cssClass = size.map((it) => `ion-modal-${it}`)
    delete options.content
    delete options.inputs
    delete options.context
    delete options.injector
    delete options.size

    const modal = ctrl
      .create({
        ...options,
        cssClass: cssClass,
        component: ModalComponent,
        componentProps: props,
      })
      .then((it) => {
        const host = it.parentElement
        fullscreen.change$.pipe(takeUntil(close$)).subscribe((fs) => {
          if (fs.active && fs.element instanceof HTMLElement) {
            fs.element.appendChild(it)
          } else {
            host.appendChild(it)
          }
        })
        return it
      })

    close$.subscribe((data) => modal.then((it) => it.dismiss(data)))
    const onDismiss = modal.then((it) => it.onDidDismiss<R>())
    const onWillDismiss = modal.then((it) => it.onWillDismiss<R>())
    const result = onDismiss.then(({ data }) => data)

    onDismiss.finally(() => close$.complete())
    modal.then((it) => it.present())

    return {
      close: (res?: R) => modal.then((it) => it.dismiss(res)),
      closing: onWillDismiss,
      closed: onDismiss,
      result: result,
      get result$() {
        return from(result)
      },
    }
  }

  public close() {
    this.ctrl.dismiss()
  }

  public async withLoadingIndicator(options: LoadingOptions, task: () => Promise<void>) {
    const loading = await this.loading.create(options)
    loading.present()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await task().finally(() => loading.dismiss())
  }

  public async showToast(options: ToastOptions) {
    const toast = await this.toast.create(options)
    await toast.present()
  }
}

@Injectable()
export class ModalRef<T = unknown> {
  public constructor(private close$: Subject<T>) {}

  public close(res?: T) {
    this.close$.next(res)
  }
}
