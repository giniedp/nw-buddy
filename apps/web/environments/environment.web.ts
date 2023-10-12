import { Environment, env, getEnvDataCdnUrl, getEnvDataDeployUrl, getEnvModelsUrl } from './env'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: false,
  environment: 'WEB',
  modelsUrl: getEnvModelsUrl(env),
  nwDataUrl: getEnvDataDeployUrl(env),
  //nwDataUrl: getEnvDataCdnUrl(env),
}
