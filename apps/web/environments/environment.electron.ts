import { env } from './env'
import { Environment, getNwDataDeployUrl, getModelsUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'ELECTRON',
  modelsUrl: getModelsUrl(env),
  nwDataUrl: getNwDataDeployUrl(env),
}
