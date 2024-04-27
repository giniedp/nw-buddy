import { env } from './env'
import { Environment, getNwDataDeployUrl, getModelsUrl, getWorldTilesUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'CAPACITOR',
  modelsUrl: getModelsUrl(env),
  nwDataUrl: getNwDataDeployUrl(env),
  worldTilesUrl: getWorldTilesUrl(env)
}
