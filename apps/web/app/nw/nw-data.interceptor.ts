import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HTTP_INTERCEPTORS,
} from '@angular/common/http'
import { Injectable } from '@angular/core'
import { environment } from 'apps/web/environments/environment'
import { map, Observable } from 'rxjs'

@Injectable({ providedIn: 'root' })
export class NwDataInterceptor implements HttpInterceptor {
  public static provide() {
    return {
      provide: HTTP_INTERCEPTORS,
      useClass: NwDataInterceptor,
      multi: true,
    }
  }

  public storagePath: string = environment.nwDataUrl.replace(/\/+$/, '')

  private get needsTransform() {
    return !this.storagePath.startsWith('nw-data')
  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('localization/')) {
      // just prepend the CDN url, no transformation
      return next.handle(this.prependPath(req))
    }
    if (req.url.startsWith('datatables/')) {
      // prepend the CDN url and transform image URLs
      return next.handle(this.prependPath(req)).pipe(map((res) => this.transformResponse(res)))
    }
    return next.handle(req)
  }

  private prependPath(req: HttpRequest<any>) {
    return req.clone({
      url: `${this.storagePath}/${req.url}`,
    })
  }

  private transformResponse(res: HttpEvent<any>) {
    if (!this.needsTransform) {
      return res
    }
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
    return data.map((item) => {
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'string' && value.startsWith('nw-data/')) {
          item[key] = value.replace(/nw-data\/(live|ptr)\//, this.storagePath + '/')
        }
      })
      return item
    })
  }
}
