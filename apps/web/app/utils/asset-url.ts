import { environment } from "apps/web/environments"

export function assetUrl(url: string) {
  if (!url?.startsWith('assets/') && !url?.startsWith('./assets/')) {
    return url
  }
  return (environment.deployUrl || '') + url
}
