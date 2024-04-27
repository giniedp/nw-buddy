import { env } from './env'
import { Environment, getNwDataDeployUrl, getModelsUrl, getWorldTilesCdnUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'LOCAL',
  modelsUrl: getModelsUrl(env),
  nwDataUrl: getNwDataDeployUrl(env),
  worldTilesUrl: getWorldTilesCdnUrl(env)
}
