import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { CanActivateFn } from '@angular/router'
import { environment } from 'apps/web/environments/environment'
import { getNwDataPath } from 'apps/web/environments/utils'
import { Observable, map } from 'rxjs'

export function activateVersionGuard(param: string): CanActivateFn {
  return (snapshot) => {
    const version = snapshot.paramMap.get(param) || ''
    console.log(version)
    const interceptor = inject(NwDataInterceptor)
    interceptor.setVersion(version)
    return true
  }
}

@Injectable({ providedIn: 'root' })
export class NwDataInterceptor implements HttpInterceptor {
  public static provide() {
    return [
      {
        provide: NwDataInterceptor,
        useClass: NwDataInterceptor,
      },
      {
        provide: HTTP_INTERCEPTORS,
        useExisting: NwDataInterceptor,
        multi: true,
      },
    ]
  }

  public static readonly activateVersionGuard = activateVersionGuard

  public nwDataUrl: string = environment.nwDataUrl // for datasheets and locales
  public cdnDataUrl: string = environment.cdnDataUrl // for images

  public setVersion(version: string) {
    this.nwDataUrl = new URL(getNwDataPath(version), environment.cdnUrl).toString()
    console.log(this.nwDataUrl)
  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('localization/') || req.url.startsWith('generated/')) {
      // just prepend the CDN url, no transformation
      return next.handle(this.prependPath(req))
    }
    if (req.url.startsWith('datatables/')) {
      // prepend the CDN url and transform image URLs + locale strings
      return next.handle(this.prependPath(req)).pipe(map((res) => this.transformDatasheetResponse(res)))
    }
    return next.handle(req)
  }

  private prependPath(req: HttpRequest<any>) {
    return req.clone({
      url: `${this.nwDataUrl}/${req.url}`,
    })
  }

  private transformDatasheetResponse(res: HttpEvent<any>) {
    if (!(res instanceof HttpResponse)) {
      return res
    }
    res.clone({
      body: this.transformImageUrls(res.body),
    })
    return res
  }

  private transformImageUrls(data: any) {
    if (!Array.isArray(data)) {
      return data
    }
    for (const item of data) {
      for (const key in item) {
        const value = item[key]
        if (typeof value !== 'string') {
          continue
        }
        if (value.startsWith('lyshineui')) {
          item[key] = this.cdnDataUrl + '/' + value
        }
        if (value.startsWith('@')) {
          item[key] = value.substring(1)
        }
      }
    }
    return data
  }
}
