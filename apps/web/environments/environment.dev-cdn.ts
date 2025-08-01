import { env } from './env'
import { Environment, getCharacterUrl, getModelsUrl, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'DEV',
  nwbtUrl: '/nwbt',
  modelsUrl: getModelsUrl(env, 'cdnUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
  nwImagesUrl: getNwDataUrl(env, 'cdnUrl'),
  nwTilesUrl: getNwDataUrl(env, 'cdnUrl'),
  nwCharUrl: getCharacterUrl(env, 'cdnUrl'),
}
