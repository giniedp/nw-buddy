import { env } from './env'
import { Environment, getEnvDataDeployUrl, getEnvModelsUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'CAPACITOR',
  modelsUrl: getEnvModelsUrl(env),
  nwDataUrl: getEnvDataDeployUrl(env),
}
