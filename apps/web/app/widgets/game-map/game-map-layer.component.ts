import { Directive, Injector, OnDestroy, computed, effect, inject, input, model, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Feature, FeatureCollection, Geometry } from 'geojson'
import { ExpressionSpecification, FilterSpecification, GeoJSONSource, Map, MapLayerEventType } from 'maplibre-gl'
import tinycolor from 'tinycolor2'
import { GameMapHost } from './game-map-host'
import { STACK_RING_FILTER, StackFan, stackRingRadius, withStacks } from './map-stacks'
import { attachLayerHover } from './map-utils'

/**
 * Point radius by the `size` property (0..2, default 1)
 */
const POINT_RADIUS: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['coalesce', ['number', ['get', 'size'], 1], ['number', 1]],
  0,
  0,
  2,
  20,
]

@Directive({
  standalone: true,
  selector: '[nwbMapLayer]',
  exportAs: 'mapLayer',
})
export class GameMapLayerDirective<G extends Geometry, P> implements OnDestroy {
  private host = inject(GameMapHost)
  protected get map() {
    return this.host.map
  }

  public layerId = input.required<string>({ alias: 'nwbMapLayer' })
  public disabled = model(false)
  public data = model<FeatureCollection<G, P>>()
  public icons = input<boolean>()
  public color = input<string>()
  public polygons = input<boolean>()
  public polyOpacity = input<number>(0.5)
  public outline = input<boolean>()
  public outlineDashed = input<boolean>()
  public outlineColor = input<string>()
  public outlinePad = input<number>(0)
  public minZoom = input<number>(0)
  public maxZoom = input<number>(0)
  public heatmap = input<boolean>()
  public heatmapColor = input<string>()
  public labels = input<boolean>()
  public labelSize = input<number>(16)
  public labelsMinZoom = input<number>(14)
  public labelsMaxZoom = input<number>(0)
  public filter = input<FilterSpecification>()
  /**
   * Points at the same position draw rings, one per visible member, and fan out on hover
   */
  public stacks = input<boolean>(true)
  private injector = inject(Injector)
  private sourceId = computed(() => this.layerId())
  private iconLayerId = computed(() => `icon-${this.layerId()}`)
  private circleLayerId = computed(() => `circle-${this.layerId()}`)
  private ringLayerId = computed(() => `ring-${this.layerId()}`)
  private useStacks = computed(() => this.stacks() && !this.polygons())
  private sourceData = computed(() => {
    const data = this.data() || { type: 'FeatureCollection', features: [] }
    return this.useStacks() ? withStacks(data) : data
  })
  private fan: StackFan = null
  private heatmapLayerId = computed(() => `heatmap-${this.layerId()}`)
  private labelLayerId = computed(() => `label-${this.layerId()}`)
  private polyLayerId = computed(() => `poly-${this.layerId()}`)
  private outlineLayerId = computed(() => `outline-${this.layerId()}`)
  public variants = model<string[]>(null)
  public featuresBelowCursor = signal<Array<Feature<G, P>>>(null)
  public featureClick = output<Array<Feature<G, P>>>()
  public featureMouseEnter = output<Array<Feature<G, P>>>()
  public featureMouseLeave = output<Array<Feature<G, P>>>()
  public featureMouseMove = output<Array<Feature<G, P>>>()

  public constructor() {
    this.host.ready$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.bind()
    })
  }

  public ngOnDestroy() {
    this.dispose()
  }

  public toggle() {
    this.disabled.set(!this.disabled())
  }

  public toggleVariant(id: string) {
    let variants = this.variants() || []
    if (variants.includes(id)) {
      variants = variants.filter((v) => v !== id)
    } else {
      variants = [...variants, id]
    }
    if (!variants.length) {
      variants = null
    }
    this.variants.set(variants)
    this.disabled.set(!variants)
  }

  /**
   * Created on first hover: bind may run before the inputs are set
   */
  private getFan() {
    this.fan ??= new StackFan({
      map: this.map,
      id: this.layerId(),
      color: this.color() ?? null,
      icons: !!this.icons(),
      onMouseEnter: (e) => this.emitMouseEnter(e.features),
      onMouseMove: (e) => this.emitMouseMove(e.features),
      onMouseLeave: (e) => this.emitMouseLeave(e.features),
      onClick: this.handleClick,
    })
    return this.fan
  }

  private bind() {
    this.effect(() => {
      if (this.disabled()) {
        this.dispose()
      } else {
        this.getSource().setData(this.sourceData())
      }
    })
    this.effect(() => {
      if (!this.disabled()) {
        this.getSource()
        this.updateFilter(this.variants(), this.filter())
        this.updateColor(this.heatmapColor())
      }
    })
  }

  private effect(fn: () => void) {
    effect(fn, {
      injector: this.injector,
    })
  }

  private getSource() {
    const sourceId = this.sourceId()
    const iconLayerId = this.iconLayerId()
    const circleLayerId = this.circleLayerId()
    const labelLayerId = this.labelLayerId()
    const polyLayerId = this.polyLayerId()
    const lineLayerId = this.outlineLayerId()

    const useIcons = this.icons()
    const usePolygons = this.polygons()
    const useLines = this.outline()
    const useCircles = !usePolygons
    const useHeatmap = this.heatmap()
    const useLabels = this.labels()
    const minZoom = this.minZoom()
    const maxZoom = this.maxZoom()

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })
    }

    if (!useHeatmap && this.map.getLayer(this.heatmapLayerId())) {
      this.removeLayer(labelLayerId)
      this.removeLayer(circleLayerId)
      this.removeLayer(iconLayerId)
      this.removeLayer(polyLayerId)
    }

    if (!usePolygons) {
      this.removeLayer(polyLayerId)
    } else if (!this.map.getLayer(polyLayerId)) {
      this.map.addLayer({
        id: polyLayerId,
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
        type: 'fill',
        layout: {},
        paint: {
          'fill-color': this.color() ?? ['get', 'color'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.05,
            ['boolean', ['feature-state', 'selected'], false],
            0.15,
            this.polyOpacity(),
          ],
        },
      })
      this.map.on('click', polyLayerId, this.handleClick)
      this.map.on('mouseenter', polyLayerId, this.handleMouseEnter)
      this.map.on('mouseleave', polyLayerId, this.handleMouseLeave)
      this.map.on('mousemove', polyLayerId, this.handleMouseMove)
      attachLayerHover({
        map: this.map,
        sourceId: sourceId,
        layerId: polyLayerId,
      })
    }

    if (!useLines) {
      this.removeLayer(lineLayerId)
    } else if (!this.map.getLayer(lineLayerId)) {
      const pad = this.outlinePad()
      const color = this.outlineColor() ?? this.color()
      this.map.addLayer({
        id: lineLayerId,
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
        type: 'line',
        layout: {
          'line-join': 'round',
        },
        paint: {
          'line-color': color ?? ['get', 'color'],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            4 + pad,
            ['boolean', ['feature-state', 'hover'], false],
            4 + pad,
            1 + pad,
          ],
          'line-dasharray': this.outlineDashed() ? [4, 2] : [4, 0],
        },
      })
    }

    const ringLayerId = this.ringLayerId()
    if (!useCircles || !this.useStacks()) {
      this.removeLayer(ringLayerId)
    } else if (!this.map.getLayer(ringLayerId)) {
      // below the points: one ring per member, filtered like the points
      this.map.addLayer({
        id: ringLayerId,
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
        type: 'circle',
        filter: STACK_RING_FILTER,
        paint: {
          'circle-radius': stackRingRadius(useIcons ? 18 : POINT_RADIUS),
          'circle-opacity': 0,
          'circle-stroke-color': this.color() ?? ['get', 'color'],
          'circle-stroke-width': 1.5,
        },
      })
    }

    if (!useCircles) {
      this.removeLayer(circleLayerId)
    } else if (!this.map.getLayer(circleLayerId)) {
      this.map.addLayer({
        id: circleLayerId,
        source: sourceId,
        minzoom: minZoom,
        maxzoom: maxZoom,
        type: 'circle',
        paint: {
          'circle-radius': POINT_RADIUS,
          'circle-color': this.color() ?? ['get', 'color'],
          'circle-stroke-color': '#000000',
          'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1],
        },
        layout: {
          'circle-sort-key': [
            'interpolate',
            ['linear'],
            ['coalesce', ['number', ['get', 'size'], 1], ['number', 1]],
            0,
            2,
            2,
            1,
          ],
        },
      })
      this.map.on('click', circleLayerId, this.handleClick)
      this.map.on('mouseenter', circleLayerId, this.handleMouseEnter)
      this.map.on('mouseleave', circleLayerId, this.handleMouseLeave)
      this.map.on('mousemove', circleLayerId, this.handleMouseMove)
      attachLayerHover({
        map: this.map,
        sourceId: sourceId,
        layerId: circleLayerId,
      })
    }

    if (!useIcons) {
      this.removeLayer(iconLayerId)
    } else if (!this.map.getLayer(iconLayerId)) {
      //this.removeLayer(circleLayerId)
      this.map.addLayer({
        id: iconLayerId,
        source: sourceId,
        minzoom: minZoom,
        type: 'symbol',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': ['number', ['get', 'iconSize'], 1],
          'icon-allow-overlap': true,
          'symbol-sort-key': ['get', 'zindex'],
        },
        paint: {
          //'icon-color': '#FF0000',
        },
      })
      this.map.on('click', iconLayerId, this.handleClick)
      this.map.on('mouseenter', iconLayerId, this.handleMouseEnter)
      this.map.on('mouseleave', iconLayerId, this.handleMouseLeave)
      this.map.on('mousemove', iconLayerId, this.handleMouseMove)
    }
    if (!useLabels) {
      this.removeLayer(labelLayerId)
    } else if (!this.map.getLayer(labelLayerId)) {
      this.map.addLayer({
        id: labelLayerId,
        source: sourceId,
        minzoom: 15,
        type: 'symbol',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': this.labelSize(),
          'text-overlap': 'cooperative',
          'text-offset': [0, useIcons ? 1.5 : 0],
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 2,
          'text-halo-blur': 2,
        },
      })
    }

    if (!useHeatmap) {
      this.removeLayer(this.heatmapLayerId())
    } else if (!this.map.getLayer(this.heatmapLayerId())) {
      this.map.addLayer({
        id: this.heatmapLayerId(),
        source: sourceId,
        type: 'heatmap',
        maxzoom: 18,
        paint: {
          // Increase the heatmap weight based on frequency and property magnitude
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['coalesce', ['number', ['get', 'size'], 1], ['number', 1]],
            0,
            0.25,
            1,
            1,
          ],
          // Increase the heatmap color weight weight by zoom level
          // heatmap-intensity is a multiplier on top of heatmap-weight
          //'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 3],
          // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
          // Begin color ramp at 0-stop with a 0-transparency color
          // to create a blur-like effect.
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0,
            'rgba(33,102,172,0)',
            0.2,
            'rgb(103,169,207)',
            0.4,
            'rgb(209,229,240)',
            0.6,
            'rgb(253,219,199)',
            0.8,
            'rgb(239,138,98)',
            1,
            'rgb(178,24,43)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 15, 15, 25],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 1, 14.5, 0],
        },
      })
    }

    if (useHeatmap) {
      this.withLayer(iconLayerId, (layer) => {
        layer.minzoom = 14
        // layer.setPaintProperty('circle-opacity', ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, 1])
        // layer.setPaintProperty('circle-stroke-opacity', ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, 0.5])
      })
      this.withLayer(ringLayerId, (layer) => {
        layer.minzoom = 14
        layer.setPaintProperty('circle-stroke-opacity', ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, 0.8])
      })
      this.withLayer(circleLayerId, (layer) => {
        layer.minzoom = 14
        layer.setPaintProperty('circle-opacity', ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, 1])
        layer.setPaintProperty('circle-stroke-opacity', ['interpolate', ['linear'], ['zoom'], 14, 0, 14.5, 0.5])
      })
    }
    this.withLayer(labelLayerId, (layer) => {
      layer.minzoom = this.labelsMinZoom()
      layer.maxzoom = this.labelsMaxZoom()
    })

    return this.map.getSource(sourceId) as GeoJSONSource
  }

  private updateFilter(variants: string[], customFilter: FilterSpecification) {
    let filter: FilterSpecification = customFilter
    let variantFilter: FilterSpecification
    if (variants) {
      variantFilter = ['in', ['get', 'variant'], ['literal', variants]]
    }
    if (customFilter && variants) {
      filter = ['all', customFilter, variantFilter] as any
    } else {
      filter = customFilter || variantFilter
    }
    if (this.map.getLayer(this.iconLayerId())) {
      this.map.setFilter(this.iconLayerId(), filter)
    }
    if (this.map.getLayer(this.circleLayerId())) {
      this.map.setFilter(this.circleLayerId(), filter)
    }
    if (this.map.getLayer(this.ringLayerId())) {
      this.map.setFilter(this.ringLayerId(), filter ? (['all', filter, STACK_RING_FILTER] as any) : STACK_RING_FILTER)
    }
    if (this.map.getLayer(this.labelLayerId())) {
      this.map.setFilter(this.labelLayerId(), filter)
    }
    if (this.map.getLayer(this.heatmapLayerId())) {
      this.map.setFilter(this.heatmapLayerId(), filter)
    }
  }

  private updateColor(value: string) {
    if (!value) {
      return
    }

    const hsl = tinycolor(value).toHsl()
    const heatmap = this.map.getLayer(this.heatmapLayerId())

    if (heatmap) {
      heatmap.setPaintProperty('heatmap-color', [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        tinycolor(hsl).setAlpha(0).toRgbString(),
        0.25,
        tinycolor({
          ...hsl,
          l: 0.7,
        }).toRgbString(),
        0.5,
        tinycolor({
          ...hsl,
          l: 0.525,
        }).toRgbString(),
        1,
        tinycolor({
          ...hsl,
          l: 0.35,
        }).toRgbString(),
      ])
    }
  }

  private dispose() {
    this.fan?.close()
    this.removeLayer(this.labelLayerId())
    this.removeLayer(this.iconLayerId())
    this.removeLayer(this.circleLayerId())
    this.removeLayer(this.ringLayerId())
    this.removeLayer(this.heatmapLayerId())
    this.removeLayer(this.polyLayerId())
    this.removeLayer(this.outlineLayerId())
    this.removeSource(this.sourceId())
  }

  private removeLayer(id: string) {
    if (this.map.getLayer(id)) {
      this.map.off('click', id, this.handleClick)
      this.map.off('mouseenter', id, this.handleMouseEnter)
      this.map.off('mouseleave', id, this.handleMouseLeave)
      this.map.off('mousemove', id, this.handleMouseMove)
      this.map.removeLayer(id)
    }
  }

  private removeSource(id: string) {
    if (this.map.getSource(id)) {
      this.map.removeSource(id)
    }
  }

  private handleMouseEnter = (e: MapLayerEventType['mouseenter']) => {
    const features = this.withoutFanned(e.features)
    if (features.length) {
      this.emitMouseEnter(features)
    } else {
      this.emitMouseLeave(features)
    }
  }

  private handleMouseLeave = (e: MapLayerEventType['mouseleave']) => {
    this.emitMouseLeave(e.features)
  }

  private handleMouseMove = (e: MapLayerEventType['mousemove']) => {
    const features = this.withoutFanned(e.features)
    if (features.length) {
      this.emitMouseMove(features)
    } else {
      this.emitMouseLeave(features)
    }
  }

  /**
   * Opens the fan for a hovered stack. Its members are left out: the fan shows them one by one.
   */
  private withoutFanned(features: MapLayerEventType['mousemove']['features']) {
    if (!this.useStacks() || !features) {
      return features ?? []
    }
    const key = this.getFan().hover(features)
    if (!key) {
      return features
    }
    return features.filter((it) => it.properties?.['stackKey'] !== key)
  }

  private emitMouseEnter = (list: MapLayerEventType['mouseenter']['features']) => {
    const features = list as any as Array<Feature<G, P>>
    this.featuresBelowCursor.set(features)
    this.featureMouseEnter.emit(features)
  }

  private emitMouseLeave = (list: MapLayerEventType['mouseleave']['features']) => {
    const features = list as any as Array<Feature<G, P>>
    this.featuresBelowCursor.set(null)
    this.featureMouseLeave.emit(features)
  }

  private emitMouseMove = (list: MapLayerEventType['mousemove']['features']) => {
    const features = list as any as Array<Feature<G, P>>
    this.featuresBelowCursor.set(features)
    this.featureMouseMove.emit(features)
  }

  private handleClick = (e: MapLayerEventType['click']) => {
    e.preventDefault()
    const features = e.features as any as Array<Feature<G, P>>
    this.featureClick.emit(features)
  }

  private withLayer(layerId: string, fn: (layer: ReturnType<Map['getLayer']>) => void) {
    const layer = this.map.getLayer(layerId)
    if (layer) {
      fn(layer)
    }
  }
}
