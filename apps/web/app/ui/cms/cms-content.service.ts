import { HttpClient } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { map } from 'rxjs'
import { fromMarkdown } from 'mdast-util-from-markdown'

@Injectable({ providedIn: 'root' })
export class CmsContentConfig {
  public basePath: string
}

@Injectable({ providedIn: 'root' })
export class CmsContentService {
  protected http: HttpClient = inject(HttpClient)
  protected config: CmsContentConfig = inject(CmsContentConfig)

  public getContent(contentPath: string) {
    if (this.config.basePath) {
      contentPath = this.config.basePath + contentPath
    }
    return this.http
      .get(contentPath, {
        responseType: 'text',
      })
      .pipe(
        map((res) => {
          return fromMarkdown(res, {})
        }),
      )
  }
}
