import { Config } from './Config'
import type { ConfigValues } from './properties'
import { viewerConfigSchema } from './schema'

export interface ViewerConfigOptions {
  /**
   * Whether the settings are loaded from and saved to the localStorage. Default true.
   */
  persist?: boolean
}

/**
 * The runtime settings of the viewer, provided as a system: `entity.service(ViewerConfig)`
 */
export class ViewerConfig extends Config<typeof viewerConfigSchema> {
  public constructor(options: ViewerConfigOptions = {}) {
    super(viewerConfigSchema, {
      storageKey: 'nw-viewer.config',
      // undefined: the localStorage
      storage: options.persist === false ? null : undefined,
    })
  }
}

/**
 * The current values of {@link ViewerConfig}
 */
export type ViewerConfigValues = Readonly<ConfigValues<typeof viewerConfigSchema>>
