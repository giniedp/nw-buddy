import { inject, Injectable, signal } from '@angular/core'
import type { ViewerOutput } from '@nw-buddy/viewer'
import { PreferencesService } from '~/preferences'
import { environment } from '../../../environments'

const OUTPUT_PREFERENCE = 'viewer-output'

/**
 * The debug output of the 3D views (GBuffer, AO, lighting), kept for the session. Not available in production builds.
 */
@Injectable({ providedIn: 'root' })
export class ViewerOutputService {
  private preferences = inject(PreferencesService)

  public readonly isEnabled = !environment.production
  public readonly output = signal<ViewerOutput>(this.restore())

  public select(output: ViewerOutput) {
    this.output.set(output)
    this.preferences.session.set(OUTPUT_PREFERENCE, output)
  }

  private restore(): ViewerOutput {
    if (!this.isEnabled) {
      return 'final'
    }
    return this.preferences.session.get<ViewerOutput>(OUTPUT_PREFERENCE) ?? 'final'
  }
}
