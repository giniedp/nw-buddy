import { inject } from "@angular/core";
import { GameMapComponent } from "./game-map.component";
import { GameMapProxyService } from "./game-map.proxy";

export function injectGameMapHost() {
  const component = inject(GameMapComponent, {optional: true});
  if (component) {
    return component
  }
  const proxy = inject(GameMapProxyService, {optional: true});
  if (proxy) {
    return proxy
  }
  return null
}
