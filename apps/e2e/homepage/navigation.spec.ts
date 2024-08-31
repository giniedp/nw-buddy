import { test, expect } from '@playwright/test';

test('Has Menu', async ({ page }) => {
  await page.goto('/');

  const appMenu = page.getByTestId('app-menu')
  await expect(appMenu).toHaveCount(3)

});

test('It Navigates', async ({ page }) => {
  await page.goto('/');

  const appMenu = page.getByTestId('app-menu')
  await appMenu.getByText('Items').click()
  await page.waitForURL('**/items')
  await appMenu.getByText('Housing').click()
  await page.waitForURL('**/housing')
  await appMenu.getByText('Crafting').click()
  await page.waitForURL('**/crafting')
  await appMenu.getByText('Perks').click()
  await page.waitForURL('**/perks')
  await appMenu.getByText('Abilities').click()
  await page.waitForURL('**/abilities')
});
