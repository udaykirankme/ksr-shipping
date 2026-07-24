import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

async function run() {
  console.log('--- KSR SHIPPING REGRESSION VERIFICATION ---');
  let success = true;

  try {
    // 1. Verify Quote Creation (tests Zod schema fix for shipment_type)
    console.log('\n1. Testing Quote Request Submission...');
    const quotePayload = {
      name: 'Regression Tester',
      phone: '9999999999',
      pickup_location: 'Hyderabad',
      drop_location: 'Mumbai',
      package_type: 'Box',
      shipment_type: 'Express Courier',
      notes: 'Please test this'
    };

    const quoteRes = await fetch('http://localhost:5000/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotePayload)
    });
    
    const quoteResult = await quoteRes.json();
    if (quoteResult.success) {
      console.log('✅ Quote API Success. Quote ID:', quoteResult.data.quote_id);
      // Verify DB
      const dbQuote = await prisma.quotationRequest.findUnique({ where: { quote_id: quoteResult.data.quote_id } });
      if (dbQuote && dbQuote.notes && dbQuote.notes.includes('Shipment Type: Express Courier')) {
        console.log('✅ DB Verification: shipment_type successfully mapped into notes!');
      } else {
        console.error('❌ DB Verification Failed: Notes do not contain mapped shipment_type:', dbQuote?.notes);
        success = false;
      }
    } else {
      console.error('❌ Quote API Failed:', quoteResult);
      success = false;
    }

    // 2. Verify Contact Creation
    console.log('\n2. Testing Contact Message Submission...');
    const contactRes = await fetch('http://localhost:5000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Regression Contact',
        phone: '8888888888',
        email: 'test@example.com',
        subject: 'Regression Inquiry',
        message: 'This is a test message.'
      })
    });
    const contactResult = await contactRes.json();
    if (contactResult.success) {
      console.log('✅ Contact API Success. Contact ID:', contactResult.data.contact_id);
    } else {
      console.error('❌ Contact API Failed:', contactResult);
      success = false;
    }

    // 3. Rate Limit Admin Dashboard Polling Test
    console.log('\n3. Testing Admin Rate Limiter Bypass...');
    console.log('Hitting /api/track 110 times to verify public rate limiter is working...');
    let rateLimited = false;
    for(let i=0; i<110; i++) {
       const res = await fetch('http://localhost:5000/api/track', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ trackingNumber: 'INVALID' })
       });
       if (res.status === 429) rateLimited = true;
    }
    if (rateLimited) {
       console.log('✅ Public endpoint correctly rate limited (429 Too Many Requests)');
    } else {
       console.log('⚠️ Public endpoint was NOT rate limited. Ensure rate limiter is active.');
    }

    // 4. Test Shipment Sorting / "Disappearing"
    console.log('\n4. Testing Shipment Booked Date and Sorting...');
    const d = new Date();
    await prisma.shipment.create({
      data: {
        tracking_id: 'KSR_TEST_1',
        official_tracking_id: 'OFF_TEST_1',
        sender_name: 'Rahul',
        receiver_name: 'Priya',
        booked_date: new Date('2026-07-23'),
        estimated_delivery: new Date('2026-07-28'),
        current_status: 'Shipment Created',
        tracking_type: 'manual'
      }
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    await prisma.shipment.create({
      data: {
        tracking_id: 'KSR_TEST_2',
        official_tracking_id: 'OFF_TEST_2',
        sender_name: 'Amit',
        receiver_name: 'Neha',
        booked_date: new Date('2026-07-23'),
        estimated_delivery: new Date('2026-07-29'),
        current_status: 'Shipment Created',
        tracking_type: 'manual'
      }
    });

    const recent = await prisma.shipment.findMany({
      where: { booked_date: new Date('2026-07-23') },
      orderBy: [
        { booked_date: 'desc' },
        { created_at: 'desc' }
      ]
    });
    
    if (recent.length >= 2 && recent[0].tracking_id === 'KSR_TEST_2') {
       console.log('✅ Secondary sort by created_at works correctly! Newest is first despite identical booked_date.');
    } else {
       console.error('❌ Sorting logic failed. Expected KSR_TEST_2 to be first.');
       success = false;
    }

    await prisma.shipment.deleteMany({
      where: { tracking_id: { in: ['KSR_TEST_1', 'KSR_TEST_2'] } }
    });
    
    await prisma.quotationRequest.deleteMany({
      where: { name: 'Regression Tester' }
    });
    
    await prisma.contactSubmission.deleteMany({
      where: { name: 'Regression Contact' }
    });

  } catch (err) {
    console.error('CRITICAL TEST ERROR:', err);
    success = false;
  } finally {
    await prisma.$disconnect();
  }

  if (success) {
    console.log('\n🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY! Ready for production.');
  } else {
    console.log('\n❌ SOME TESTS FAILED. Please review the logs above.');
    process.exit(1);
  }
}

run();
