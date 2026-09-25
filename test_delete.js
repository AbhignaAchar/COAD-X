const SUPABASE_URL = 'https://ufdtuzkkwkrzjvrzytbh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZHR1emtrd2tyemp2cnp5dGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTk4NzQsImV4cCI6MjEwNTkzNTg3NH0.vX5LM7SCGWB3StOgRFtfk8Q5f2OSP-wD-uMkxVkq4gw';
const BUCKET_NAME = 'forensic-reports';

async function testDeleteStorageObject() {
  try {
    console.log(`[COAD-X Storage Delete Test] Target Bucket: "${BUCKET_NAME}"`);

    // 1. Upload a temporary file specifically for this deletion test
    const testFileName = `temp_delete_test_${Date.now()}.pdf`;
    const dummyContent = Buffer.from('%PDF-1.4\n%COAD-X Test File For Deletion Verification\n%%EOF');

    console.log(`\n1. Creating temporary test file in bucket: "${testFileName}"...`);
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${encodeURIComponent(testFileName)}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true'
      },
      body: dummyContent
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed with status: ${uploadRes.status} ${uploadRes.statusText}`);
    }
    console.log(`   ✓ Uploaded temporary file successfully (Status: ${uploadRes.status}).`);

    // 2. Verify file exists in bucket listing
    console.log(`\n2. Verifying file exists in bucket...`);
    const listRes1 = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefix: '', limit: 100 })
    });
    const foundBefore = await listRes1.json();
    const existsBefore = Array.isArray(foundBefore) && foundBefore.some(f => f.name === testFileName);
    console.log(`   ✓ File presence confirmed in bucket before deletion: ${existsBefore}`);

    // 3. Delete the file using Supabase Storage delete API
    console.log(`\n3. Deleting "${testFileName}" from bucket "${BUCKET_NAME}"...`);
    const deleteRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefixes: [testFileName]
      })
    });

    console.log(`   Delete Response Status: ${deleteRes.status} ${deleteRes.statusText}`);
    const deleteData = await deleteRes.json();
    console.log('   Delete API Response:', deleteData);

    if (!deleteRes.ok) {
      throw new Error(`Delete failed with status: ${deleteRes.status}`);
    }

    // 4. Verify file is removed from bucket
    console.log(`\n4. Confirming file is removed from bucket...`);
    const listRes2 = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prefix: testFileName, limit: 1 })
    });
    const foundAfter = await listRes2.json();
    const existsAfter = Array.isArray(foundAfter) && foundAfter.some(f => f.name === testFileName);

    if (!existsAfter) {
      console.log(`   ✓ File "${testFileName}" was successfully deleted and no longer exists in bucket.`);
      console.log('\n[SUCCESS] Supabase Storage Delete Test passed with flying colors!');
    } else {
      console.warn(`   ⚠ File still detected in bucket. Check RLS or deletion response.`);
    }

  } catch (err) {
    console.error('[ERROR] Delete test failed:', err.message);
    process.exit(1);
  }
}

testDeleteStorageObject();
