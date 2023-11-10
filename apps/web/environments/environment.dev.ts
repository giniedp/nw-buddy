import { env } from './env'
import { Environment, getEnvDataDeployUrl, getEnvModelsUrl } from './utils'

export const environment: Environment = {
  ...env,
  production: false,
  standalone: false,
  environment: 'DEV',
  modelsUrl: getEnvModelsUrl(env),
  nwDataUrl: getEnvDataDeployUrl(env),
  //nwDataUrl: getEnvDataCdnUrl(env),
}
