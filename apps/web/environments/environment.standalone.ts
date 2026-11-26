import { env } from './env'
import { Environment, getModelsUrl, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'STANDALONE',
  // the desktop app proxies nwbt on the page's origin (apps/desktop/proxy.go)
  nwbtUrl: '/nwbt',
  modelsUrl: getModelsUrl(env, 'cdnUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
  nwImagesUrl: getNwDataUrl(env, 'deployUrl'),
  nwTilesUrl: getNwDataUrl(env, 'cdnUrl'),
  nwCharUrl: null,
}
