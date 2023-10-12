import { Environment, env, getEnvDataDeployUrl, getEnvModelsUrl } from './env'

export const environment: Environment = {
  ...env,
  production: true,
  standalone: true,
  environment: 'CAPACITOR',
  modelsUrl: getEnvModelsUrl(env),
  nwDataUrl: getEnvDataDeployUrl(env),
}
