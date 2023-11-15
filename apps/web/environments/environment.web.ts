import { env } from './env'
import { Environment, getEnvDataDeployUrl, getEnvModelsUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: false,
  environment: 'WEB',
  modelsUrl: getEnvModelsUrl(env),
  nwDataUrl: getEnvDataDeployUrl(env),
  //nwDataUrl: getEnvDataCdnUrl(env),
}
