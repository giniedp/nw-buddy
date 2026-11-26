import { env } from './env'
import { Environment, getCharacterUrl, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'DEV',
  nwbtUrl: '/nwbt',
  modelsUrl: '/nw-cdn/models',
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
  nwImagesUrl: getNwDataUrl(env, 'deployUrl'),
  nwTilesUrl: getNwDataUrl(env, 'deployUrl'),
  nwCharUrl: '/nw-cdn/models/character',
}
