import { env } from './env'

export const environment = {
  ...env,
  production: true,
  environment: 'CAPACITOR',
  standalone: true
}
