// This file is required by karma.conf.js and loads recursively all the .spec and framework files

// import 'zone.js/testing'
import { getTestBed } from '@angular/core/testing'
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing'

// called before any tests are run
const e: any = window.onerror
// ignore ResizeObserver loop limit exceeded
// this is ok in several scenarios according to
// https://github.com/WICG/resize-observer/issues/38
beforeAll(() => {
  window.onerror = function (err) {
    if (err === 'ResizeObserver loop limit exceeded') {
      console.warn('Ignored: ResizeObserver loop limit exceeded')
      return false
    } else {
      return e(...arguments)
    }
  }
})

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting())
