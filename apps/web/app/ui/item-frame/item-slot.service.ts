import { Injectable } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ItemRarity } from '@nw-data/common'
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  from,
  map,
  mergeMap,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs'
import { shareReplayRefCount } from '~/utils'

interface RarityStyle {
  c0: string
  c1: string
  c2: string
  bgSquare: string
  bgRound: string
  bgHead: string
  bgSquareNamed?: string | null
  bgAnimated?: string | null
}

const RARITY_STYLES: Record<ItemRarity, RarityStyle> = {
  common: {
    c0: '#2e3236',
    c1: '#dddddd',
    c2: '#666666',
    bgSquare: `assets/icons/item/itemraritybgsquare0.png`,
    bgRound: `assets/icons/item/itemraritybgcircle0.png`,
    bgHead: `assets/icons/item/tooltip_header_bg_0.png`,
    bgSquareNamed: null,
    bgAnimated: null,
  },
  uncommon: {
    c0: '#19451c',
    c1: '#34ec5b',
    c2: '#00ab1a',
    bgSquare: `assets/icons/item/itemraritybgsquare1.png`,
    bgRound: `assets/icons/item/itemraritybgcircle1.png`,
    bgHead: `assets/icons/item/tooltip_header_bg_1.png`,
    bgSquareNamed: `assets/icons/item/itemraritybgsquarenamed1.png`,
    bgAnimated: `assets/icons/item/named_bg_1.webp`,
  },
  rare: {
    c0: '#144f5d',
    c1: '#72ffff',
    c2: '#31bdeb',
    bgSquare: `assets/icons/item/itemraritybgsquare2.png`,
    bgRound: `assets/icons/item/itemraritybgcircle2.png`,
    bgHead: `assets/icons/item/tooltip_header_bg_2.png`,
    bgSquareNamed: `assets/icons/item/itemraritybgsquarenamed2.png`,
    bgAnimated: `assets/icons/item/named_bg_2.webp`,
  },
  epic: {
    c0: '#421849',
    c1: '#ff57ff',
    c2: '#e600de',
    bgSquare: `assets/icons/item/itemraritybgsquare3.png`,
    bgRound: `assets/icons/item/itemraritybgcircle3.png`,
    bgHead: `assets/icons/item/tooltip_header_bg_3.png`,
    bgSquareNamed: `assets/icons/item/itemraritybgsquarenamed3.png`,
    bgAnimated: `assets/icons/item/named_bg_3.webp`,
  },
  legendary: {
    c0: '#55371c',
    c1: '#ffa535',
    c2: '#f07808',
    bgSquare: `assets/icons/item/itemraritybgsquare4.png`,
    bgRound: `assets/icons/item/itemraritybgcircle4.png`,
    bgHead: `assets/icons/item/tooltip_header_bg_4.png`,
    bgSquareNamed: `assets/icons/item/itemraritybgsquarenamed4.png`,
    bgAnimated: `assets/icons/item/named_bg_4.webp`,
  },
  artifact: {
    c1: '#ff7c55',
    c2: '#b42e0a',
    c0: '#63230e',
    bgSquare: `assets/icons/item/itemraritybgsquareartifact.png`,
    bgRound: `assets/icons/item/itemraritybgsquareartifact.png')`, // has no circle varnt
    bgHead: `assets/icons/item/tooltip_header_bg_artifact.png`,
    bgSquareNamed: null,
    bgAnimated: `assets/icons/item/artifact_bg.webp`,
  },
}

const LINK_ICON =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAVElEQVQ4jdWRMQ7AIAwDz/z/WeVd7sQCRlAxVNwa20ocuB/b1YGgSzxKYgBJ6gOirg16w8bmBihfTIkhYNZJu3kZAMRbZ7P/Ozh+YwHqwQJDqRfyAhb0ckzto9dcAAAAAElFTkSuQmCC'

const MAX_CONCURRENT_JOBS = 5

export interface TileInput {
  rarity: ItemRarity
  isNamed: boolean
  isLinked: boolean
  icon: string
  gemIcon: string
  slotIcon: string
}

@Injectable({
  providedIn: 'root',
})
export class ItemSlotService {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private imageCache: Map<string, Observable<ImageBitmap | HTMLImageElement>> = new Map()
  private tileCache: Map<string, Observable<string>> = new Map()
  private jobLimiter = createConcurrencyLimiter(MAX_CONCURRENT_JOBS)

  public constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
  }

  public rarityStyle(rarity: ItemRarity): RarityStyle {
    return RARITY_STYLES[rarity] || RARITY_STYLES.common
  }

  public loadTile(input: TileInput) {
    const id = JSON.stringify(input)
    if (!this.tileCache.has(id)) {
      this.tileCache.set(
        id,
        this.createTileStream(input).pipe(
          distinctUntilChanged(),
          shareReplayRefCount(1),
          tap({
            finalize: () => this.tileCache.delete(id),
          }),
        ),
      )
    }
    return this.tileCache.get(id)
  }

  private createTileStream(input: TileInput): Observable<string> {
    return defer(() => {
      const controller = new AbortController()

      return this.jobLimiter().pipe(
        switchMap(async () => this.createTile(input, controller.signal)),
        finalize(() => {
          controller.abort()
        }),
      )
    })
  }

  private async createTile(input: TileInput, abort: AbortSignal): Promise<string> {
    if (abort.aborted) {
      return null
    }

    const style = RARITY_STYLES[input.rarity] || RARITY_STYLES.common
    const background = (input.isNamed ? style.bgSquareNamed : style.bgSquare) || style.bgSquare

    const data = await firstValueFrom(
      combineLatest({
        background: this.loadImage(background).pipe(startWith(null)),
        linkIcon: input.isLinked ? this.loadImage(LINK_ICON) : of(null),
        slotIcon: this.loadImage(input.slotIcon),
        gemIcon: this.loadImage(input.gemIcon),
        icon: this.loadImage(input.icon),
      }),
    )
    if (abort.aborted) {
      return null
    }

    return renderTile(this.canvas, this.ctx, {
      c0: style.c0,
      c1: style.c1,
      c2: style.c2,
      background: data.background,
      icon: data.icon,
      gemIcon: data.gemIcon,
      linkIcon: data.linkIcon,
      slotIcon: data.slotIcon,
    })
  }

  private loadImage(url: string): Observable<ImageBitmap | HTMLImageElement> {
    if (!this.imageCache.has(url)) {
      this.imageCache.set(
        url,
        this.createImage(url).pipe(
          distinctUntilChanged(),
          shareReplayRefCount(1),
          tap({
            finalize: () => this.imageCache.delete(url),
          }),
        ),
      )
    }
    return this.imageCache.get(url)
  }

  private createImage(url: string): Observable<ImageBitmap | HTMLImageElement> {
    if (!url) {
      return of<ImageBitmap>(null)
    }
    return from(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = (err) => reject(err)
        img.crossOrigin = 'anonymous'
        img.src = url
      }),
    )
  }
}

export interface RenderTileOptions {
  c0: string
  c1: string
  c2: string
  background: ImageBitmap | HTMLImageElement | null
  icon: ImageBitmap | HTMLImageElement | null
  gemIcon: ImageBitmap | HTMLImageElement | null
  slotIcon: ImageBitmap | HTMLImageElement | null
  linkIcon: ImageBitmap | HTMLImageElement | null
}

function renderTile(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, data: RenderTileOptions) {
  const size = 64
  const dpr = Math.ceil(window.devicePixelRatio || 1)
  canvas.width = size * dpr
  canvas.height = size * dpr
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = data.c0
  ctx.fillRect(0, 0, size, size)

  if (data.background) {
    ctx.drawImage(data.background, 0, 0, size, size)
  }

  if (data.icon) {
    ctx.drawImage(data.icon, 0, 0, size, size)
  } else if (data.slotIcon) {
    ctx.drawImage(data.slotIcon, 4, 4, size - 8, size - 8)
  }

  if (data.gemIcon) {
    const rSize = Math.ceil(size / 2)
    const pad = 2
    const pad2 = pad * 2
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    drawRoundedTopLeftRect(ctx, size - rSize, size - rSize, rSize, rSize, rSize / 2)
    ctx.drawImage(data.gemIcon, size - rSize + pad, size - rSize + pad, rSize - pad2, rSize - pad2)
  }

  if (data.linkIcon) {
    const rSize = 16 + 4
    const pad = 2
    const pad2 = pad * 2
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    drawRoundedBottomLeftRect(ctx, size - rSize, 0, rSize, rSize, rSize / 2)
    ctx.drawImage(data.linkIcon, size - rSize + pad, pad, rSize - pad2, rSize - pad2)
  }

  return canvas.toDataURL('image/png')
}

function drawRoundedTopLeftRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y) // top edge
  ctx.lineTo(x + width, y) // top-right corner
  ctx.lineTo(x + width, y + height) // right edge
  ctx.lineTo(x, y + height) // bottom edge
  ctx.lineTo(x, y + radius) // left edge
  ctx.quadraticCurveTo(x, y, x + radius, y) // top-left corner curve
  ctx.closePath()
  ctx.fill()
}

function drawRoundedBottomLeftRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath()
  ctx.moveTo(x, y) // top-left
  ctx.lineTo(x + width, y) // top edge
  ctx.lineTo(x + width, y + height) // right edge
  ctx.lineTo(x + radius, y + height) // bottom edge (before curve)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius) // bottom-left curve
  ctx.lineTo(x, y) // left edge
  ctx.closePath()
  ctx.fill()
}

function createConcurrencyLimiter(max: number) {
  let active = 0
  const queue = new Subject<() => void>()

  queue.subscribe((run) => run())

  return function acquire(): Observable<void> {
    return new Observable<void>((subscriber) => {
      const tryAcquire = () => {
        if (active < max) {
          active++
          subscriber.next()
          subscriber.complete()
        } else {
          queue.next(() => tryAcquire())
        }
      }

      tryAcquire()

      return () => {
        active--
        // Let next job in
        queue.next(() => {})
      }
    })
  }
}
