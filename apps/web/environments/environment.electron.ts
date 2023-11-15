import { env } from './env'
import { Environment, getEnvDataDeployUrl, getEnvModelsUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'ELECTRON',
  modelsUrl: getEnvModelsUrl(env),
  nwDataUrl: getEnvDataDeployUrl(env),
}
