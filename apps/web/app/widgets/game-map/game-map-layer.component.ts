import {
  Component,
  Directive,
  Injector,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
} from '@angular/core'
import { GeoJSON } from 'geojson'
import { FilterSpecification, GeoJSONSource } from 'maplibre-gl'
import { GameMapComponent } from './game-map.component'
import tinycolor from 'tinycolor2'
import { GameMapProxyService } from './game-map.proxy'

@Directive({
  standalone: true,
  selector: '[nwbMapLayer]',
  exportAs: 'mapLayer',
})
export class GameMapLayerDirective implements OnInit, OnDestroy {
  private proxy = inject(GameMapProxyService, { optional: true })
  private parent = inject(GameMapComponent, { optional: true })
  protected get map() {
    return (this.parent || this.proxy)?.map
  }

  public layerId = input.required<string>({ alias: 'nwbMapLayer' })
  public disalbed = model(false)
  public data = model<GeoJSON>()
  public icons = input<boolean>()
  public color = input<string>()
  public heatmap = input<boolean>()
  private injector = inject(Injector)
  private sourceId = computed(() => this.layerId())
  private iconLayerId = computed(() => `icon-${this.layerId()}`)
  private circleLayerId = computed(() => `circle-${this.layerId()}`)
  private heatmapLayerId = computed(() => `heatmap-${this.layerId()}`)
  public variants = signal<string[]>(null)

  public ngOnInit() {
    this.bind()
    // if (this.map.loaded()) {
    //   this.bind()
    // } else {
    //   this.map.on('load', () => this.bind())
    // }
  }

  public ngOnDestroy() {
    this.dispose()
  }

  public toggle() {
    this.disalbed.set(!this.disalbed())
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
    this.disalbed.set(!variants)
  }

  private bind() {
    this.effect(() => {
      if (this.disalbed()) {
        this.dispose()
      } else {
        this.getSource().setData(this.data() || { type: 'FeatureCollection', features: [] })
        this.updateFilter(this.variants())
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

    if (!this.map.getSource(sourceId)) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      })
    }
    if (this.icons() && !this.map.getLayer(iconLayerId)) {
      this.removeLayer(circleLayerId)
      this.map.addLayer({
        id: iconLayerId,
        source: sourceId,
        type: 'symbol',
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': [
            'interpolate',
            ['linear'],
            ['coalesce', ['number', ['get', 'size', 1]], ['number', 1]],
            0,
            0,
            2,
            2,
          ],
          'icon-allow-overlap': true,
          'symbol-sort-key': ['get', 'zindex'],
        },
        paint: {
          //'icon-color': '#FF0000',
        },
      })
    }
    if (!this.icons() && !this.map.getLayer(circleLayerId)) {
      this.removeLayer(iconLayerId)
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
          'circle-stroke-width': 1,
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
    }
    if (this.heatmap()) {
      if (!this.map.getLayer(this.heatmapLayerId())) {
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
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 5, 1, 7, 0],
          },
        })
      }
      let layer = this.map.getLayer(this.iconLayerId())
      if (layer) {
        layer.minzoom = 5
        layer.setPaintProperty('circle-opacity', ['interpolate', ['linear'], ['zoom'], 5, 0, 6, 1])
        layer.setPaintProperty('circle-stroke-opacity', ['interpolate', ['linear'], ['zoom'], 5, 0, 6, 0.5])
      }
      layer = this.map.getLayer(this.circleLayerId())
      if (layer) {
        layer.minzoom = 5
        layer.setPaintProperty('circle-opacity', ['interpolate', ['linear'], ['zoom'], 5, 0, 6, 1])
        layer.setPaintProperty('circle-stroke-opacity', ['interpolate', ['linear'], ['zoom'], 5, 0, 6, 0.5])
      }
    } else {
      this.removeLayer(this.heatmapLayerId())
    }

    return this.map.getSource(sourceId) as GeoJSONSource
  }

  private updateFilter(variants: string[]) {
    let filter: FilterSpecification = null
    if (variants) {
      filter = ['in', 'variant', ...variants]
    }
    if (this.map.getLayer(this.iconLayerId())) {
      this.map.setFilter(this.iconLayerId(), filter)
    }
    if (this.map.getLayer(this.circleLayerId())) {
      this.map.setFilter(this.circleLayerId(), filter)
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
    this.removeLayer(this.iconLayerId())
    this.removeLayer(this.circleLayerId())
    this.removeLayer(this.heatmapLayerId())
    this.removeSource(this.sourceId())
  }

  private removeLayer(id: string) {
    if (this.map.getLayer(id)) {
      this.map.removeLayer(id)
    }
  }

  private removeSource(id: string) {
    if (this.map.getSource(id)) {
      this.map.removeSource(id)
    }
  }
}
