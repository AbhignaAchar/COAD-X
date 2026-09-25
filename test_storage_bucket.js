const SUPABASE_URL = 'https://ufdtuzkkwkrzjvrzytbh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZHR1emtrd2tyemp2cnp5dGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTk4NzQsImV4cCI6MjEwNTkzNTg3NH0.vX5LM7SCGWB3StOgRFtfk8Q5f2OSP-wD-uMkxVkq4gw';
const BUCKET_NAME = 'forensic-reports';

async function testStorageBucket() {
  try {
    console.log(`[COAD-X Storage Test] Testing Supabase Storage bucket: "${BUCKET_NAME}"...`);

    const fileName = `COAD-X_Test_Report_${Date.now()}.pdf`;
    const dummyPdfContent = Buffer.from('%PDF-1.4\n%COAD-X Cyber Forensic Test Report\n%%EOF');

    console.log(`1. Uploading test file: ${fileName}...`);
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${encodeURIComponent(fileName)}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true'
      },
      body: dummyPdfContent
    });

    console.log(`   Upload Status: ${uploadRes.status} ${uploadRes.statusText}`);
    const uploadData = await uploadRes.json();
    console.log('   Upload Result:', uploadData);

    console.log(`\n2. Listing files from "${BUCKET_NAME}"...`);
    const listRes = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefix: '',
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    });

    console.log(`   List Status: ${listRes.status} ${listRes.statusText}`);
    const files = await listRes.json();
    console.log(`   Found ${Array.isArray(files) ? files.length : 0} file(s) in bucket.`);
    if (Array.isArray(files)) {
      files.forEach((f, idx) => console.log(`   [${idx + 1}] ${f.name} (${f.metadata?.size || f.size || 'N/A'} bytes)`));
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodeURIComponent(fileName)}`;
    console.log(`\n3. Public Download URL:`);
    console.log(`   ${publicUrl}`);
    console.log('\n[SUCCESS] Storage bucket test completed successfully.');
  } catch (err) {
    console.error('[ERROR] Storage bucket test failed:', err.message);
  }
}

testStorageBucket();
