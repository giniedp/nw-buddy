import { env } from './env'
import { Environment, getEnvDataDeployUrl, getEnvModelsUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'LOCAL',
  modelsUrl: getEnvModelsUrl(env),
  nwDataUrl: getEnvDataDeployUrl(env),
}
