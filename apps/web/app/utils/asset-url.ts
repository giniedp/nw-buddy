import { environment } from 'apps/web/environments'

export function assetUrl(url: string) {
  if (!url?.startsWith('assets/') && !url?.startsWith('./assets/')) {
    return url
  }
  return deployUrl(url)
}
export function deployUrl(url: string) {
  return (environment.deployUrl || '') + url
}
