import { Directive, Injector, OnDestroy, computed, effect, inject, input, model, output, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Feature, FeatureCollection, Geometry } from 'geojson'
import { FilterSpecification, GeoJSONSource, Map, MapLayerEventType } from 'maplibre-gl'
import tinycolor from 'tinycolor2'
import { GameMapHost } from './game-map-host'
import { attachLayerHover } from './utils'

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
  public polygons = input<boolean>()
  public color = input<string>()
  public heatmap = input<boolean>()
  public labels = input<boolean>()
  public labelsMinZoom = input<number>(5)
  public filter = input<FilterSpecification>()
  private injector = inject(Injector)
  private sourceId = computed(() => this.layerId())
  private iconLayerId = computed(() => `icon-${this.layerId()}`)
  private circleLayerId = computed(() => `circle-${this.layerId()}`)
  private heatmapLayerId = computed(() => `heatmap-${this.layerId()}`)
  private labelLayerId = computed(() => `label-${this.layerId()}`)
  private polyLayerId = computed(() => `poly-${this.layerId()}`)
  public variants = signal<string[]>(null)
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

  private bind() {
    this.effect(() => {
      if (this.disabled()) {
        this.dispose()
      } else {
        this.getSource().setData(this.data() || { type: 'FeatureCollection', features: [] })
        this.updateFilter(this.variants(), this.filter())
        this.updateColor(this.color())
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
    const useIcons = this.icons()
    const usePlolygons = this.polygons()
    const useCircles = !usePlolygons
    const useHeatmap = this.heatmap()
    const useLabels = this.labels()

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

    if (!usePlolygons) {
      this.removeLayer(polyLayerId)
    } else if (!this.map.getLayer(polyLayerId)) {
      this.map.addLayer({
        id: polyLayerId,
        source: sourceId,
        type: 'fill',
        layout: {},
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.5,
        },
      })
    }

    if (!useCircles) {
      this.removeLayer(circleLayerId)
    } else if (!this.map.getLayer(circleLayerId)) {
      this.map.addLayer({
        id: circleLayerId,
        source: sourceId,
        type: 'circle',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['coalesce', ['number', ['get', 'size'], 1], ['number', 1]],
            0,
            0,
            2,
            20,
          ],
          'circle-color': ['get', 'color'],
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
        minzoom: 6,
        type: 'symbol',
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 16,
          'text-overlap': 'cooperative',
          'text-offset': [0, useIcons ? 1.5 : 0],
        },
        paint: {
          'text-color': '#FFFFFF',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
          'text-halo-blur': 1,
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
        maxzoom: 9,
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
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 6, 25],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 5, 1, 5.5, 0],
        },
      })
    }

    if (useHeatmap) {
      this.withLayer(iconLayerId, (layer) => {
        layer.minzoom = 5
        // layer.setPaintProperty('circle-opacity', ['interpolate', ['linear'], ['zoom'], 5, 0, 5.5, 1])
        // layer.setPaintProperty('circle-stroke-opacity', ['interpolate', ['linear'], ['zoom'], 5, 0, 5.5, 0.5])
      })
      this.withLayer(circleLayerId, (layer) => {
        layer.minzoom = 5
        layer.setPaintProperty('circle-opacity', ['interpolate', ['linear'], ['zoom'], 5, 0, 5.5, 1])
        layer.setPaintProperty('circle-stroke-opacity', ['interpolate', ['linear'], ['zoom'], 5, 0, 5.5, 0.5])
      })
    }
    this.withLayer(labelLayerId, (layer) => {
      layer.minzoom = this.labelsMinZoom()
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
    this.removeLayer(this.labelLayerId())
    this.removeLayer(this.iconLayerId())
    this.removeLayer(this.circleLayerId())
    this.removeLayer(this.heatmapLayerId())
    this.removeLayer(this.polyLayerId())
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
    const features = e.features as any as Array<Feature<G, P>>
    this.featuresBelowCursor.set(features)
    this.featureMouseEnter.emit(features)
  }

  private handleMouseLeave = (e: MapLayerEventType['mouseleave']) => {
    const features = e.features as any as Array<Feature<G, P>>
    this.featuresBelowCursor.set(null)
    this.featureMouseLeave.emit(features)
  }

  private handleMouseMove = (e: MapLayerEventType['mousemove']) => {
    const features = e.features as any as Array<Feature<G, P>>
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
