import { env } from './env'
import { Environment, getCharacterUrl, getModelsUrl, getNwDataUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: false,
  environment: 'WEB',
  modelsUrl: getModelsUrl(env, 'cdnUrl'),
  nwImagesUrl: getNwDataUrl(env, 'cdnUrl'),
  nwTilesUrl: getNwDataUrl(env, 'cdnUrl'),
  nwDataUrl: getNwDataUrl(env, 'deployUrl'),
  nwCharUrl: getCharacterUrl(env, 'cdnUrl'),
}
