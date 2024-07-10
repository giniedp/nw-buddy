import { Page } from '@playwright/test'

export function withQuickfilter(page: Page) {
  const quickfilter = page.locator('nwb-quicksearch-input')
  const quickfilterInput = quickfilter.locator('input')
  return {
    quickfilter,
    quickfilterInput,
  }
}

export function withTableGrid(page: Page) {
  const table = page.locator('nwb-table-grid')
  const tableRows = table.locator('.ag-row')
  const virtualGrid = page.locator('nwb-virtual-grid')
  const displayToggle = page.getByTestId('nwbDataViewToggle')
  return {
    table,
    tableRows,
    column: (name: string) => table.locator(`.ag-cell[col-id="${name}"]`),
  }
}
