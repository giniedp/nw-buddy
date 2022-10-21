import { env } from './env'

export const environment = {
  ...env,
  production: true,
  environment: 'ELECTRON',
}
