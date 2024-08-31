import { expect, test } from '@playwright/test'
import { pageObjectModel, withQuickfilter, withTableGrid } from '../utils'

test.beforeEach(async ({ page }) => {
  await page.goto('/housing')
})

test('has table', async ({ page }) => {
  const pom = pageObjectModel(page, withQuickfilter, withTableGrid)
  await expect(pom.table).toBeVisible()
  await expect(async () => expect(await pom.tableRows.count()).toBeGreaterThan(0)).toPass()
  await expect(pom.tableRows.nth(0)).toBeVisible()
  await expect(pom.column('name').first()).toBeVisible()
  await pom.column('name').first().click()
  await page.waitForURL(/\/housing\/.+$/)
  await page.waitForTimeout(500)
})
