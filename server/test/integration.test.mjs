import assert from 'node:assert';

const BASE_URL = 'http://localhost:3001/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json();
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('🛡️  Running Vigil Comprehensive Test Suite');
console.log('========================================\n');

// 1. Health
await test('Health check endpoint returns status healthy', async () => {
  const { status, data } = await request('/health');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.status, 'healthy');
  assert.strictEqual(data.service, 'Vigil Intelligence API');
});

// 2. Categories
let testCatId = '';
await test('Categories list returns seeded categories', async () => {
  const { status, data } = await request('/categories');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(Array.isArray(data.data));
  assert.ok(data.data.length >= 9);
});

await test('Create new custom category', async () => {
  const { status, data } = await request('/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Category Integration',
      icon: '🧪',
      color: '#8B5CF6',
      description: 'Temporary category for automated testing',
      default_risk_level: 'high',
    }),
  });
  assert.strictEqual(status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.name, 'Test Category Integration');
  testCatId = data.data.id;
});

// 3. Items CRUD & Validation
let testItemId = '';
await test('Create new item with validation', async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 10);
  const expiryDate = tomorrow.toISOString().split('T')[0];

  const { status, data } = await request('/items', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Integration Test Certificate',
      description: 'Automated test suite item',
      category_id: testCatId,
      status: 'active',
      expiry_date: expiryDate,
      cost: 1500,
      currency: 'USD',
      recurrence: 'annual',
      risk_level: 'high',
      vendor: 'SecurityCorp Inc.',
      tags: ['test', 'automated', 'critical'],
    }),
  });

  assert.strictEqual(status, 201);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.name, 'Integration Test Certificate');
  assert.strictEqual(data.data.days_until_expiry, 10);
  assert.ok(data.data.risk_score >= 50);
  testItemId = data.data.id;
});

await test('Validation catches missing required fields', async () => {
  const { status, data } = await request('/items', {
    method: 'POST',
    body: JSON.stringify({
      description: 'Missing name and expiry_date',
    }),
  });
  assert.strictEqual(status, 400);
  assert.strictEqual(data.success, false);
});

await test('Fetch single item by ID includes computed fields', async () => {
  const { status, data } = await request(`/items/${testItemId}`);
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.id, testItemId);
  assert.strictEqual(data.data.category_name, 'Test Category Integration');
  assert.ok(Array.isArray(data.data.tags));
  assert.ok(data.data.tags.includes('automated'));
});

// 4. One-Click Renewal
await test('One-click renewal advances expiry date by recurrence cycle', async () => {
  const { status, data } = await request(`/items/${testItemId}/renew`, {
    method: 'POST',
  });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.status, 'active');
  // Annual recurrence should advance days_until_expiry to roughly 375 days
  assert.ok(data.data.days_until_expiry > 360);
});

// 5. Snooze
await test('Snooze item updates status to snoozed', async () => {
  const { status, data } = await request(`/items/${testItemId}/snooze`, {
    method: 'POST',
    body: JSON.stringify({ days: 14 }),
  });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.data.status, 'snoozed');
});

// 6. Search
await test('Full text search locates item by tag/name/vendor', async () => {
  const { status, data } = await request('/search?q=SecurityCorp');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.some(i => i.id === testItemId));
});

// 7. Dashboard Metrics
await test('Dashboard metrics calculate real aggregate figures', async () => {
  const { status, data } = await request('/dashboard');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.totalItems > 0);
  assert.ok(data.data.monthlyCost > 0);
  assert.ok(Array.isArray(data.data.byCategory));
  assert.ok(Array.isArray(data.data.byRiskLevel));
  assert.ok(Array.isArray(data.data.upcomingTimeline));
});

// 8. Alerts
await test('Alert rules list and alert test evaluation', async () => {
  const { status, data } = await request('/alerts/rules');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length >= 4);

  const testRun = await request('/alerts/test', { method: 'POST' });
  assert.strictEqual(testRun.status, 200);
  assert.strictEqual(testRun.data.success, true);
});

// 9. Document Upload & Deletion
await test('Document upload, metadata record, and deletion', async () => {
  const formData = new FormData();
  const fileBlob = new Blob(['Vigil Compliance Verification Document Mock'], { type: 'text/plain' });
  formData.append('file', fileBlob, 'compliance_cert.txt');

  const uploadRes = await fetch(`${BASE_URL}/documents/upload/${testItemId}`, {
    method: 'POST',
    body: formData,
  });
  const uploadData = await uploadRes.json();

  assert.strictEqual(uploadRes.status, 201);
  assert.strictEqual(uploadData.success, true);
  assert.strictEqual(uploadData.data.original_name, 'compliance_cert.txt');

  const docId = uploadData.data.id;

  // Download check
  const downloadRes = await fetch(`${BASE_URL}/documents/download/${docId}`);
  assert.strictEqual(downloadRes.status, 200);
  const text = await downloadRes.text();
  assert.strictEqual(text, 'Vigil Compliance Verification Document Mock');

  // Delete document
  const deleteRes = await request(`/documents/${docId}`, { method: 'DELETE' });
  assert.strictEqual(deleteRes.status, 200);
  assert.strictEqual(deleteRes.data.success, true);
});

// 10. Bulk Operations & Cleanup
await test('Bulk status update and cleanup test item', async () => {
  const bulkStatus = await request('/items/bulk-update-status', {
    method: 'POST',
    body: JSON.stringify({ ids: [testItemId], status: 'archived' }),
  });
  assert.strictEqual(bulkStatus.status, 200);
  assert.strictEqual(bulkStatus.data.success, true);

  const bulkDelete = await request('/items/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids: [testItemId] }),
  });
  assert.strictEqual(bulkDelete.status, 200);
  assert.strictEqual(bulkDelete.data.data.deleted, 1);
});

await test('Delete test category', async () => {
  const { status, data } = await request(`/categories/${testCatId}`, {
    method: 'DELETE',
  });
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
});

// 11. Activity Log Verification
await test('Activity log audited all operations', async () => {
  const { status, data } = await request('/activity?page=1&limit=10');
  assert.strictEqual(status, 200);
  assert.strictEqual(data.success, true);
  assert.ok(data.data.length > 0);
  assert.ok(data.data.some(a => a.action === 'item_renewed' || a.action === 'item_created'));
});

console.log('\n========================================');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('========================================\n');

if (failed > 0) process.exit(1);
