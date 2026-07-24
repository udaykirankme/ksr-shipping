import fs from 'fs';

const API_BASE = 'http://localhost:5000/api';
let authToken = '';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('--- Starting E2E Integration Tests ---');
  
  // 1. Admin Login
  console.log('1. Logging in as admin...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'password123' })
  });
  const loginData = await loginRes.json();
  assert(loginRes.ok, 'Admin login failed');
  const cookie = loginRes.headers.get('set-cookie');
  if (cookie) {
    authToken = cookie.split(';')[0].split('=')[1];
  } else {
    // If testing mock or didn't set cookie, maybe token is in body
    authToken = loginData.token || 'mock_token';
  }
  const headers = { 'Cookie': `auth_token=${authToken}`, 'Content-Type': 'application/json' };
  console.log('✅ Admin login successful');

  // Get initial dashboard stats
  console.log('Fetching initial dashboard stats...');
  const initialStatsRes = await fetch(`${API_BASE}/admin/dashboard-stats`, { headers });
  const initialStats = await initialStatsRes.json();
  const initialShipments = initialStats.totalShipments || 0;
  console.log(`Initial total shipments: ${initialShipments}`);

  // Get initial notifications
  console.log('Fetching initial notifications...');
  const initialNotifRes = await fetch(`${API_BASE}/admin/notifications`, { headers });
  const initialNotifs = await initialNotifRes.json();
  const initialUnreadNotifs = initialNotifs.unreadCount || 0;
  console.log(`Initial unread notifications: ${initialUnreadNotifs}`);

  // 2. Submit Quote Request
  console.log('\n2. Submitting Quote Request from public website...');
  const quoteRes = await fetch(`${API_BASE}/quotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Quote User',
      phone: '1234567890',
      email: 'quote@example.com',
      pickup_location: 'New York',
      drop_location: 'Los Angeles'
    })
  });
  assert(quoteRes.ok, 'Failed to submit quote request');
  const quoteData = await quoteRes.json();
  assert(quoteData.id, 'Quote response missing ID');
  console.log('✅ Quote request submitted');

  // 3. Submit Contact Form
  console.log('\n3. Submitting Contact Form from public website...');
  const contactRes = await fetch(`${API_BASE}/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Contact User',
      email: 'contact@example.com',
      subject: 'Inquiry',
      message: 'This is a test message'
    })
  });
  assert(contactRes.ok, 'Failed to submit contact form');
  const contactData = await contactRes.json();
  assert(contactData.id, 'Contact response missing ID');
  console.log('✅ Contact form submitted');

  // 4. Create Shipment
  console.log('\n4. Admin creating a shipment...');
  const createShipmentRes = await fetch(`${API_BASE}/admin/shipments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tracking_id: 'TEST123456',
      official_tracking_id: `EXT${Date.now()}`,
      sender_name: 'Sender Bob',
      receiver_name: 'Receiver Alice',
      origin: 'Chicago',
      destination: 'Miami',
      current_status: 'Shipment Created'
    })
  });
  if (!createShipmentRes.ok) {
    console.error('Create shipment failed:', await createShipmentRes.text());
  }
  assert(createShipmentRes.ok, 'Failed to create shipment');
  const shipmentData = await createShipmentRes.json();
  const shipmentId = shipmentData.id;
  const trackingId = shipmentData.tracking_id;
  assert(shipmentId, 'Shipment response missing ID');
  console.log('✅ Shipment created');

  // 5. Track Shipment
  console.log('\n5. Public tracking the shipment...');
  const trackRes = await fetch(`${API_BASE}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackingNumber: trackingId })
  });
  if (!trackRes.ok) {
    console.error('Track failed:', await trackRes.text());
  }
  assert(trackRes.ok, 'Failed to track shipment');
  const trackData = await trackRes.json();
  assert(trackData.tracking_id === trackingId, 'Tracking returned wrong shipment');
  assert(trackData.current_status === 'Shipment Created', 'Tracking returned wrong status');
  console.log('✅ Shipment tracked successfully');

  // 6. Update Shipment
  console.log('\n6. Admin updating shipment status...');
  const updateShipmentRes = await fetch(`${API_BASE}/admin/shipments/${shipmentId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      current_status: 'In Transit'
    })
  });
  assert(updateShipmentRes.ok, 'Failed to update shipment');
  console.log('✅ Shipment updated');

  // 7. Track Shipment Again
  console.log('\n7. Public tracking the shipment again...');
  const trackRes2 = await fetch(`${API_BASE}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackingNumber: trackingId })
  });
  assert(trackRes2.ok, 'Failed to track shipment again');
  const trackData2 = await trackRes2.json();
  assert(trackData2.current_status === 'In Transit', 'Tracking did not reflect updated status');
  console.log('✅ Shipment tracking correctly reflected updated status');

  // 8. Verify Dashboard Stats
  console.log('\n8. Verifying Dashboard Statistics...');
  const newStatsRes = await fetch(`${API_BASE}/admin/dashboard-stats`, { headers });
  const newStats = await newStatsRes.json();
  assert(newStats.totalShipments > initialShipments, 'Dashboard total shipments did not increase');
  console.log('✅ Dashboard stats synchronized correctly');

  // 9. Verify Notifications
  console.log('\n9. Verifying Notifications...');
  const newNotifRes = await fetch(`${API_BASE}/admin/notifications`, { headers });
  const newNotifs = await newNotifRes.json();
  assert(newNotifs.unreadCount > initialUnreadNotifs, 'Unread notification count did not increase');
  
  const quoteNotif = newNotifs.items.find(n => n.related_entity_id === quoteData.id && n.type === 'QUOTE_REQUEST');
  const contactNotif = newNotifs.items.find(n => n.related_entity_id === contactData.id && n.type === 'CONTACT_MESSAGE');
  assert(quoteNotif, 'No notification found for new Quote Request');
  assert(contactNotif, 'No notification found for new Contact Message');
  console.log('✅ Notifications generated successfully for Quote and Contact requests');

  // 10. Delete Shipment
  console.log('\n10. Admin deleting the shipment...');
  const delShipmentRes = await fetch(`${API_BASE}/admin/shipments/${shipmentId}`, {
    method: 'DELETE',
    headers
  });
  assert(delShipmentRes.ok, 'Failed to delete shipment');
  console.log('✅ Shipment deleted');

  // 11. Track Deleted Shipment
  console.log('\n11. Public tracking the deleted shipment (should fail)...');
  const trackRes3 = await fetch(`${API_BASE}/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackingNumber: trackingId })
  });
  assert(!trackRes3.ok, 'Tracking deleted shipment should return an error');
  assert(trackRes3.status === 404, 'Expected 404 Not Found for deleted shipment');
  console.log('✅ Tracking correctly returned 404 for deleted shipment');

  console.log('\n✅ All End-to-End Integration Tests Passed!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
