import { environment } from "apps/web/environments"

export function getModelUrl(uri: string) {
  if (environment.nwbtUrl && uri.startsWith(environment.nwbtUrl)) {
    uri = uri.replace(environment.nwbtUrl, '')
    return {
      rootUrl: environment.nwbtUrl + '/',
      modelUrl: uri.replace(/^\//, '')
    }
  }
  return {
    rootUrl: environment.modelsUrl + '/',
    modelUrl: uri.replace(/^\//, '')
  }
}
