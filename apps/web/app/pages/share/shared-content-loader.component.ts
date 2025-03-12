import { CommonModule } from '@angular/common'
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { Router, RouterModule } from '@angular/router'
import { patchState, signalState } from '@ngrx/signals'
import { AppPreferencesService } from '~/preferences'
import { IconsModule } from '~/ui/icons'
import { svgCircleExclamation, svgCircleNotch } from '~/ui/icons/svg'
import { environment } from '../../../environments/environment'
import { ShareService, UploadContent } from './share.service'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'nwb-shared-content-loader',
  templateUrl: './shared-content-loader.component.html',
  imports: [CommonModule, IconsModule, RouterModule],
})
export class ShareLoaderComponent {
  private web3 = inject(ShareService)
  private sanitizer = inject(DomSanitizer)
  private router = inject(Router)
  private preferences = inject(AppPreferencesService)

  public cid = input<string>()
  public name = input<string>()
  public validType = input<string>()
  public showImport = input<boolean>()
  public showGateways = input<boolean>()
  public importClicked = output<any>()

  protected iconInfo = svgCircleExclamation
  protected iconError = svgCircleExclamation
  protected iconLoading = svgCircleNotch

  private state = signalState({
    content: null as UploadContent<any>,
    isLoading: true,
    isLoaded: false,
    error: null as any,
  })

  protected get appLink() {
    if (environment.standalone) {
      return null
    }
    return this.sanitizer.bypassSecurityTrustUrl(`nw-buddy://${this.router.url}`)
  }

  public isLoading = this.state.isLoading
  public isLoaded = this.state.isLoaded
  public hasError = computed(() => !!this.state.error())
  public error = this.state.error
  public record = computed(() => {
    const value = this.state.content()
    if (!value?.data || !value?.type) {
      return null
    }
    if (this.validType() && value.type !== this.validType()) {
      return null
    }
    return value.data
  })
  public recordType = computed(() => {
    return this.state.content()?.type
  })

  protected currentGateway = toSignal(this.preferences.ipfsGateway.observe())
  protected knownGateways = signal(this.web3.knownGateways)

  public constructor() {
    effect(() => {
      const cid = this.cid()
      const name = this.name()
      const gateway = this.preferences.ipfsGateway.value
      untracked(() => {
        this.web3
          .download({ name, cid, gateway })
          .then((record) => {
            patchState(this.state, {
              content: record,
              isLoading: false,
              isLoaded: true,
              error: null,
            })
          })
          .catch((error) => {
            patchState(this.state, {
              content: null,
              isLoading: false,
              isLoaded: true,
              error: error,
            })
          })
      })
    })
  }

  protected handleImport(value: any) {
    this.importClicked.emit(value)
  }

  protected tryGateway(gateway: string) {
    this.preferences.ipfsGateway.set(gateway)
    window.location.reload()
  }
}
