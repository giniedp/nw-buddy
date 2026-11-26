import { inject, Injectable } from '@angular/core'
import type { MaterialParams } from '@nw-buddy/viewer'
import { ModalService } from '~/ui/layout'
import { TranslateService } from '../../i18n'
import type { ModelItemInfo } from '../model-viewer/model-viewer.service'
import { viewerLibUrl } from '../nw-viewer'
import { composeRequest, downloadName } from './model-download'
import { ModelDownloadDialogComponent } from './model-download-dialog.component'
import { modelUrls, rowText } from './utils'

type ViewerLib = typeof import('@nw-buddy/viewer')

export interface ModelDownloadOptions {
  /**
   * Names the file after the model's label too, to tell several models apart (genders, variants)
   */
  withLabel?: boolean
  /**
   * The material params of the nwbt export, default: the model's appearance without dyes
   */
  params?: MaterialParams | null
  /**
   * The names of the animations in the nwbt export, default none
   */
  animations?: string[]
}

/**
 * Opens the downloads of a model, see {@link ModelDownloadDialogComponent}
 */
@Injectable({ providedIn: 'root' })
export class ModelDownloadService {
  private modal = inject(ModalService)
  private i18n = inject(TranslateService)

  public async open(model: ModelItemInfo, options: ModelDownloadOptions = {}) {
    const label = options.withLabel ? await this.i18n.getAsync(model.label) : null
    const name = downloadName(await this.i18n.getAsync(model.name), label)
    const { source, sockets } = model
    const compose = async () => {
      const params = options.params === undefined ? await appearanceParams(model) : options.params
      return composeRequest({ source, params, sockets, animations: options.animations ?? [], name })
    }
    ModelDownloadDialogComponent.open(this.modal, {
      files: {
        model: modelUrls(model),
        sockets: (sockets ?? []).map((it) => ({ ...it, models: it.models.map((weapon) => modelUrls(weapon)) })),
      },
      compose: source ? compose : null,
      gameFile: source?.model ?? null,
      name,
    })
  }
}

/**
 * The colors of the model's appearance, null without one
 */
async function appearanceParams(model: ModelItemInfo): Promise<MaterialParams | null> {
  const appearance = rowText(model.appearance)
  if (!appearance) {
    return null
  }
  const lib: ViewerLib = await import(/* @vite-ignore */ viewerLibUrl('nw-viewer.module.js'))
  return lib.appearanceParams(appearance)
}
