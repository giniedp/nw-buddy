import { Environment, env, getEnvDataCdnUrl, getEnvModelsUrl } from './env'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: false,
  environment: 'WEB',
  modelsUrl: getEnvModelsUrl(env),
  nwDataUrl: getEnvDataCdnUrl(env),
}
