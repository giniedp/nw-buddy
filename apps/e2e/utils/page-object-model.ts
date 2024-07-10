import { Page } from '@playwright/test'

export function pageObjectModel<B1>(page: Page, b1: PageObjectbuilderFn<B1>): B1
export function pageObjectModel<B1, B2>(page: Page, b1: PageObjectbuilderFn<B1>, b2: PageObjectbuilderFn<B2>): B1 & B2
export function pageObjectModel<B1, B2, B3>(page: Page, b1: PageObjectbuilderFn<B1>, b2: PageObjectbuilderFn<B2>, b3: PageObjectbuilderFn<B3>): B1 & B2 & B3
export function pageObjectModel<B1, B2, B3, B4>(page: Page, b1: PageObjectbuilderFn<B1>, b2: PageObjectbuilderFn<B2>, b3: PageObjectbuilderFn<B3>, b4: PageObjectbuilderFn<B4>): B1 & B2 & B3 & B4
export function pageObjectModel<B1, B2, B3, B4, B5>(page: Page, b1: PageObjectbuilderFn<B1>, b2: PageObjectbuilderFn<B2>, b3: PageObjectbuilderFn<B3>, b4: PageObjectbuilderFn<B4>, b5: PageObjectbuilderFn<B5>): B1 & B2 & B3 & B4 & B5
export function pageObjectModel<B1, B2, B3, B4, B5, B6>(page: Page, b1: PageObjectbuilderFn<B1>, b2: PageObjectbuilderFn<B2>, b3: PageObjectbuilderFn<B3>, b4: PageObjectbuilderFn<B4>, b5: PageObjectbuilderFn<B5>, b6: PageObjectbuilderFn<B6>): B1 & B2 & B3 & B4 & B5 & B6
export function pageObjectModel<T>(page: Page, ...builder: Array<PageObjectbuilderFn<T>>) {
  return builder.reduce((acc, fn) => ({ ...acc, ...fn(page) }), {} as T)
}

export type PageObjectbuilderFn<T> = (page: Page) => T

export type MergePom<FeatureResults extends Object[]> = FeatureResults extends []
  ? {}
  : FeatureResults extends [infer First extends Object]
    ? First
    : FeatureResults extends [infer First extends Object, infer Second extends Object]
      ? First & Second
      : FeatureResults extends [infer First extends Object, infer Second extends Object, ...infer Rest extends Object[]]
        ? MergePom<[First & Second, ...Rest]>
        : never

