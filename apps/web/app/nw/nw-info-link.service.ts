import { Injectable } from '@angular/core'
import { environment } from 'apps/web/environments/environment'
import { LocaleService } from '~/i18n'
import { nwdbLinkUrl, NwdbResource } from './nwdbinfo'

@Injectable({ providedIn: 'root' })
export class NwInfoLinkService {

  public constructor(private locale: LocaleService) {
    //
  }

  public link(type: NwdbResource, id: string) {
    return nwdbLinkUrl({
      id: id,
      type: type,
      lang: this.locale.value,
      ptr: environment.isPTR
    })
  }
}
