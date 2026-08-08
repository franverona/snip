import { test, expect } from '@playwright/test'

// The redirect lives on the API, not the Next.js app — apps/e2e/playwright.config.ts
// points page.baseURL at the web app, so this needs the API's own origin.
const API_URL = process.env['E2E_API_URL'] ?? 'http://localhost:3001'

function uniqueSlug() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 10_000)}`
}

test('create, redirect, track a click, and delete a URL', async ({ page }) => {
  const slug = uniqueSlug()
  const targetUrl = 'https://example.com/'

  await test.step('create a short URL with a custom slug', async () => {
    await page.goto('/new')
    await page.getByLabel('URL to shorten').fill(targetUrl)
    await page.getByLabel(/custom slug/i).fill(slug)
    await page.getByRole('button', { name: 'Shorten URL' }).click()

    await expect(page.getByText('Your short URL is ready!')).toBeVisible()
    await expect(page.getByRole('link', { name: new RegExp(slug) })).toBeVisible()
  })

  await test.step('appears in the URLs list', async () => {
    await page.goto(`/urls?q=${slug}`)
    await expect(page.getByText(targetUrl)).toBeVisible()
  })

  await test.step('visiting the short URL redirects to the original URL', async () => {
    await page.goto(`${API_URL}/${slug}`)
    await page.waitForURL(/example\.com/)
  })

  await test.step('the click shows up on the stats page', async () => {
    await page.goto(`/stats/${slug}`)
    // Click recording is fire-and-forget on the API side, so poll instead of a flat wait.
    await expect(async () => {
      await page.reload()
      await expect(page.getByTestId('total-clicks')).toHaveText('1')
    }).toPass({ timeout: 10_000 })
  })

  await test.step('deleting the URL removes it from the list', async () => {
    await page.getByRole('button', { name: 'Delete' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Delete' }).click()

    await page.waitForURL('**/urls')
    await page.goto(`/urls?q=${slug}`)
    await expect(page.getByText('No results')).toBeVisible()
  })
})
