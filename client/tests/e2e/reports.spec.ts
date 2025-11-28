import { test, expect } from '@playwright/test';

test.describe('Reports Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the reports page
    await page.goto('/reports');
    
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible();
  });

  test('should display reports list', async ({ page }) => {
    // Verify reports are displayed
    await expect(page.getByRole('listitem')).toHaveCount(5);
  });

  test('should filter reports', async ({ page }) => {
    // Filter by status
    await page.getByLabel('Status').selectOption('active');
    await expect(page.getByRole('listitem')).toHaveCount(2);
  });

  test('should navigate to report details', async ({ page }) => {
    // Click on the first report
    await page.getByRole('listitem').first().click();
    
    // Verify navigation to report details
    await expect(page.getByRole('heading', { name: /report details/i })).toBeVisible();
  });

  test('should handle empty state', async ({ page }) => {
    // Apply filter that returns no results
    await page.getByLabel('Search').fill('nonexistent');
    
    // Verify empty state is displayed
    await expect(page.getByText('No reports found')).toBeVisible();
  });
});
