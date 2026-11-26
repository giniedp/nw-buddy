import { render } from 'solid-js/web'
import { App } from './ui/app/App'
import { ViewerApp } from './ui/app/ViewerApp'

// the app at the root of the origin: the dev server and the nwbt zip
const app = new ViewerApp({
  // empty: same origin (vite proxy), otherwise the nwbt server directly, e.g. https://localhost:8443 for HTTP/2
  nwbtUrl: import.meta.env.VITE_NWBT_URL ?? '',
})
render(() => <App app={app} />, document.querySelector<HTMLDivElement>('#app'))
