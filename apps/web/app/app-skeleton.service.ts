import { DOCUMENT, inject, Injectable } from '@angular/core'
import { PlatformService } from './utils/services/platform.service'
import { Router } from '@angular/router'

@Injectable({ providedIn: 'root' })
export class AppSkeletonService {
  private platform = inject(PlatformService)
  private router = inject(Router)
  private document = inject(DOCUMENT)

  public constructor() {
    this.updateSkeletonLoader()
  }

  private querySkeletonLoader() {
    return this.document.querySelector('#skeleton-loader')
  }

  public remove() {
    const skeleton = this.querySkeletonLoader()
    if (!skeleton) {
      return
    }
    setTimeout(() => {
      skeleton.classList.remove('opacity-100')
      skeleton.classList.add('opacity-0')
      setTimeout(() => skeleton.remove(), 300)
    }, 750)
  }

  public removeWithNoDelay() {
    this.querySkeletonLoader()?.remove()
  }

  private updateSkeletonLoader() {
    if (this.platform.isEmbed) {
      return
    }
    const skeleton = this.querySkeletonLoader()
    if (!skeleton) {
      return
    }
    const isMainPage = this.router.url === '/'
    const isMobile = !matchMedia('(min-width: 1200px)').matches
    skeleton.querySelectorAll<HTMLElement>('.h-0\\!,.w-0\\!').forEach((el) => {
      if (isMainPage && el.dataset['submenu']) {
        // main page has no submenu
        return
      }
      if (isMobile && el.dataset['sidemenu']) {
        // main page has no side menu
        return
      }
      el.classList.remove('h-0!')
      el.classList.remove('w-0!')
    })
  }
}
