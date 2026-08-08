import { appendFile } from 'fs/promises';

const API_BASE = 'http://localhost:3000/api';
const LOG_FILE = 'regression_report.log';

let token = '';
const log = async (msg) => {
  console.log(msg);
  await appendFile(LOG_FILE, msg + '\n');
};

async function assert(condition, message) {
  if (!condition) {
    await log(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  await log(`✅ PASS: ${message}`);
}

async function runTests() {
  await log('--- PRODUCTION REGRESSION TESTS ---');
  try {
    // 1. Customer Workflow: Quotes
    await log('\nTesting POST /api/quotations');
    const quoteRes = await fetch(`${API_BASE}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        fromPincode: '500001',
        toPincode: '500002',
        weight: '10',
        serviceType: 'Domestic'
      })
    });
    const quoteData = await quoteRes.json();
    await assert(quoteRes.ok, 'Quote request successful');
    await assert(quoteData.success, 'Quote API returned success: true');

    // 2. Customer Workflow: Contacts
    await log('\nTesting POST /api/contact');
    const contactRes = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Contact',
        email: 'test@example.com',
        subject: 'Inquiry',
        message: 'This is a test message.'
      })
    });
    const contactData = await contactRes.json();
    await assert(contactRes.ok, 'Contact request successful');
    await assert(contactData.success, 'Contact API returned success: true');

    // 3. Customer Workflow: Invalid Tracking
    await log('\nTesting POST /api/track (Invalid)');
    const trackRes = await fetch(`${API_BASE}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: 'INVALID123' })
    });
    const trackData = await trackRes.json();
    await assert(trackRes.status === 404, 'Invalid tracking returns 404');
    await assert(!trackData.success, 'Invalid tracking API returned success: false');

    // 4. Admin Workflow: Login
    await log('\nTesting POST /api/auth/login');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123', rememberMe: false })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) { await log(JSON.stringify(loginData)); }
    await assert(loginRes.ok, 'Login successful');
    const cookieHeader = loginRes.headers.get('set-cookie');
    await assert(cookieHeader && cookieHeader.includes('auth_token='), 'Login returns auth_token cookie');
    token = cookieHeader.split(';')[0].split('=')[1];

    const authHeaders = {
      'Content-Type': 'application/json',
      'Cookie': `auth_token=${token}`
    };

    // 5. Admin Workflow: Create Shipment
    await log('\nTesting POST /api/admin/shipments');
    const shipmentRes = await fetch(`${API_BASE}/admin/shipments`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        official_tracking_id: `KSR-TEST-${Date.now()}`,
        booked_date: '2026-08-05',
        service: 'dtdc',
        service_through: 'dtdc',
        sender_name: 'Sender Test',
        sender_phone: '9999999999',
        sender_city: 'Delhi',
        receiver_name: 'Receiver Test',
        receiver_phone: '8888888888',
        receiver_city: 'Mumbai',
        weight: 5,
        num_packages: 1,
        shipment_type: 'Domestic',
        paid_amount: 400,
        received_amount: 500
      })
    });
    const shipmentData = await shipmentRes.json();
    if (!shipmentRes.ok) { await log(JSON.stringify(shipmentData)); }
    await assert(shipmentRes.ok, 'Shipment created successfully');
    const shipmentId = shipmentData.data.id;
    const version = shipmentData.data.version;
    const officialTrackingId = shipmentData.data.official_tracking_id;

    // 6. Admin Workflow: Edit Shipment
    await log('\nTesting PUT /api/admin/shipments/:id');
    const editRes = await fetch(`${API_BASE}/admin/shipments/${shipmentId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        ...shipmentData.data,
        version: version,
        paid_amount: 350, // edit paid amount
      })
    });
    const editData = await editRes.json();
    if (!editRes.ok) { await log(JSON.stringify(editData)); }
    await assert(editRes.ok, 'Shipment edited successfully');
    await assert(editData.data.profit === 150, 'Profit recalculated correctly (500 - 350 = 150)');

    // 7. Admin Workflow: Valid Tracking
    await log('\nTesting POST /api/track (Valid)');
    const trackValidRes = await fetch(`${API_BASE}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: officialTrackingId })
    });
    const trackValidData = await trackValidRes.json();
    await assert(trackValidRes.ok, 'Valid tracking returns 200');
    await assert(trackValidData.success, 'Valid tracking API returned success: true');

    // 8. Admin Workflow: Delete/Archive
    await log('\nTesting DELETE /api/admin/shipments/:id');
    const delRes = await fetch(`${API_BASE}/admin/shipments/${shipmentId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    await assert(delRes.ok, 'Shipment deleted/archived successfully');

    await log('\n🎉 ALL REGRESSION TESTS PASSED!');
  } catch (err) {
    await log(`\n💥 REGRESSION TESTS FAILED: ${err.message}`);
  }
}

runTests();
