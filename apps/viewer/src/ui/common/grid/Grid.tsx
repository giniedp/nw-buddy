import { AllCommunityModule, createGrid, ModuleRegistry, type GridApi, type GridOptions } from 'ag-grid-community'
import { onCleanup, onMount } from 'solid-js'
import { FLOATING_FILTERS_HEIGHT, gridStyleContainer, gridTheme } from './theme'
import './Grid.css'

ModuleRegistry.registerModules([AllCommunityModule])

/**
 * Hosts an AG Grid. `options` are read once, later changes go through the api handed to `ref`.
 */
export function Grid<T>(props: { options: GridOptions<T>; ref?: (api: GridApi<T>) => void; class?: string }) {
  let el!: HTMLDivElement
  onMount(() => {
    const api = createGrid(el, {
      theme: gridTheme,
      themeStyleContainer: gridStyleContainer(),
      loadThemeGoogleFonts: false,
      animateRows: false,
      suppressCellFocus: true,
      tooltipShowDelay: 400,
      enableBrowserTooltips: false,
      floatingFiltersHeight: FLOATING_FILTERS_HEIGHT,
      ...props.options,
    })
    props.ref?.(api)
    onCleanup(() => api.destroy())
  })
  return <div class={props.class ? `nw-ag ${props.class}` : 'nw-ag'} ref={el} />
}
