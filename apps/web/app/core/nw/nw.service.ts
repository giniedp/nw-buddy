import { Injectable } from '@angular/core'

import { ItemPreferencesService } from '../preferences'
import { NwDbService } from './nw-db.service'
import { NwExpressionService } from './nw-expression'
import { NwTradeskillService } from './nw-tradeskill.service'
import m from 'mithril'
import { NwLootbucketService } from './nw-lootbucket.service'

@Injectable({ providedIn: 'root' })
export class NwService {
  public constructor(
    public readonly db: NwDbService,
    public readonly lootbuckets: NwLootbucketService,
    public readonly expression: NwExpressionService,
    public readonly itemPref: ItemPreferencesService,
    public readonly tradeskills: NwTradeskillService
  ) {}

}

export interface IconComponentAttrs {
  src: string
  class: string
}
export const IconComponent: m.ClosureComponent<IconComponentAttrs> = () => {
  let hasError = false
  let didLoad = false
  function onError() {
    hasError = true
  }
  function onSuccess() {
    didLoad = true
  }
  return {
    view: ({ attrs }) => {
      return m(
        'picture',
        {
          class: attrs.class,
        },
        [
          m('img.fade', {
            src: attrs.src,
            class: [hasError ? 'error' : didLoad ? 'show' : ''].join(' '),
            onerror: onError,
            onload: onSuccess,
          }),
        ]
      )
    },
  }
}
