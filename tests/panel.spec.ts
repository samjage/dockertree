import { test, expect } from '@grafana/plugin-e2e';

test('draws one tile per container with name and load', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  await gotoPanelEditPage({ dashboard, id: '1' });
  const tiles = page.getByTestId('dockertree-tile');
  await expect(tiles.first()).toBeVisible();
  await expect(tiles.filter({ hasText: 'home-assistant' })).toContainText('Load: 19.7%');
});

test('groups tiles by stack when "Group by stack" is on', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await expect(panelEditPage.panel.locator).toContainText('smarthome');
  await expect(page.getByTestId('dockertree-tile').first()).toBeVisible();
});

test('hides the value line when "Show value and memory" is off', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  const options = panelEditPage.getCustomOptions('Tiles');
  await options.getSwitch('Show value and memory').uncheck();
  await expect(page.getByTestId('dockertree-tile').filter({ hasText: 'home-assistant' })).not.toContainText('Load:');
});
