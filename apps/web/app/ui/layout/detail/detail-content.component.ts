import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, effect, inject, input, Input, OnDestroy, TemplateRef } from '@angular/core'
import { ModalController } from '@ionic/angular/standalone'
import { NwModule } from '~/nw'
import { injectIsBrowser } from '~/utils/injection/platform'
import { ModalSize } from '../modal'

@Component({
  selector: 'nwb-detail-content',
  templateUrl: './detail-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NwModule],
  host: {
    class: 'block',
  },
})
export class DetailContentComponent implements OnDestroy {
  @Input()
  public template: TemplateRef<any>
  public isOpen = input(false)
  public initialBreakpoint = input<number>(null)
  public breakpoints = input<number[]>([0.1, 0.25, 0.5, 1])
  public backdropBreakpoint = input<number>(0.5)
  public backdropDismiss = input<boolean>(true)
  public size = input<ModalSize | ModalSize[]>()

  private ctrl = inject(ModalController)
  private modal: HTMLIonModalElement
  private isBrowser = injectIsBrowser()

  public constructor() {
    if (this.isBrowser) {
      effect(() => {
        if (this.isOpen()) {
          this.openModal()
        } else {
          this.closeModal()
        }
      })
    }
  }

  public ngOnDestroy() {
    this.closeModal()
  }

  private async openModal() {
    this.closeModal()

    let size = this.size()
    size = Array.isArray(size) ? size : [size]
    const cssClass = size.map((it) => `ion-modal-${it}`)
    const modal = (this.modal = await this.ctrl.create({
      backdropBreakpoint: this.backdropBreakpoint(),
      backdropDismiss: this.backdropDismiss(),
      initialBreakpoint: this.initialBreakpoint(),
      breakpoints: this.breakpoints(),
      cssClass,

      component: ContentWrapper,
      componentProps: {
        template: this.template,
      },
    }))
    if (this.isOpen()) {
      modal.present()
    } else {
      this.destroyModal(modal)
    }
  }

  private closeModal() {
    const modal = this.modal
    this.modal = null
    if (modal) {
      this.destroyModal(modal)
    }
  }

  private destroyModal(modal: HTMLIonModalElement) {
    if (!modal) {
      return
    }
    modal.dismiss().finally(() => modal.remove())
  }
}

@Component({
  template: ` <ng-container [ngTemplateOutlet]="template" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  host: {
    class: 'block',
  },
})
export class ContentWrapper {
  @Input()
  public template: TemplateRef<any>
}
