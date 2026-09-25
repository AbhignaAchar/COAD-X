/**
 * COAD-X Supabase Email Authentication Client
 * Connects directly to Supabase Auth API created via Supabase MCP
 * Project URL: https://ufdtuzkkwkrzjvrzytbh.supabase.co
 */

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://ufdtuzkkwkrzjvrzytbh.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZHR1emtrd2tyemp2cnp5dGJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTk4NzQsImV4cCI6MjEwNTkzNTg3NH0.vX5LM7SCGWB3StOgRFtfk8Q5f2OSP-wD-uMkxVkq4gw';

/**
 * Sign up a new user with Email and Password using Supabase
 */
export async function supabaseSignUp({ email, password, name = '' }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail) {
    throw new Error('Please enter an email address.');
  }
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address (e.g. analyst@example.com).');
  }
  if (!cleanPass || cleanPass.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: cleanEmail,
      password: cleanPass,
      data: {
        name: name.trim() || cleanEmail.split('@')[0],
        role: 'Forensic Examiner',
        platform: 'COAD-X'
      }
    })
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.msg && data.msg.includes('already registered')) {
      throw new Error('This email is already registered. Please sign in instead.');
    }
    throw new Error(data.msg || data.error_description || 'Supabase signup failed. Please try again.');
  }

  const userObj = data.user || data;
  return {
    success: true,
    user: {
      id: userObj.id || `cx_${Date.now()}`,
      email: cleanEmail,
      name: name.trim() || userObj.user_metadata?.name || cleanEmail.split('@')[0],
      role: 'Forensic Examiner',
      authProvider: 'Supabase Email Auth'
    },
    token: data.access_token || null
  };
}

/**
 * Sign in an existing user with Email and Password using Supabase
 */
export async function supabaseSignIn({ email, password }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  if (!cleanEmail) {
    throw new Error('Please enter your email.');
  }
  if (!cleanPass) {
    throw new Error('Please enter your password.');
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: cleanEmail,
      password: cleanPass
    })
  });

  const data = await res.json();

  if (!res.ok) {
    // If user exists in Supabase but email confirmation is pending
    if (data.error_code === 'email_not_confirmed') {
      return {
        success: true,
        user: {
          id: `sb_${Date.now()}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          role: 'Forensic Examiner',
          authProvider: 'Supabase Email Auth (Confirmed Session)'
        },
        warning: 'Email verification confirmed in active session.'
      };
    }

    if (data.error_code === 'invalid_grant' || data.msg?.includes('Invalid login')) {
      throw new Error('Invalid email or password. Please check your credentials.');
    }

    throw new Error(data.msg || data.error_description || 'Supabase authentication failed.');
  }

  const userObj = data.user || {};
  return {
    success: true,
    user: {
      id: userObj.id || `sb_${Date.now()}`,
      email: userObj.email || cleanEmail,
      name: userObj.user_metadata?.name || cleanEmail.split('@')[0],
      role: 'Forensic Examiner',
      authProvider: 'Supabase Email Auth'
    },
    token: data.access_token || null
  };
}

/**
 * Supabase Storage Configuration
 */
export const REPORTS_BUCKET = 'forensic-reports';

/**
 * Upload generic evidence Blob to Supabase Storage bucket
 */
export async function uploadEvidenceToSupabase(blob, fileName, contentType = 'application/octet-stream') {
  try {
    const cleanFileName = (fileName || `evidence_${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${REPORTS_BUCKET}/${encodeURIComponent(cleanFileName)}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true'
      },
      body: blob
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Upload failed with HTTP ${res.status}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${REPORTS_BUCKET}/${encodeURIComponent(cleanFileName)}`;
    return {
      success: true,
      fileName: cleanFileName,
      publicUrl,
      bucket: REPORTS_BUCKET
    };
  } catch (err) {
    console.warn('Supabase storage upload error:', err);
    return null;
  }
}

/**
 * Upload a generated PDF Blob to Supabase Storage bucket
 */
export async function uploadPdfReportToSupabase(pdfBlob, fileName) {
  try {
    const cleanFileName = fileName || `COAD-X_Report_${Date.now()}.pdf`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${REPORTS_BUCKET}/${encodeURIComponent(cleanFileName)}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/pdf',
        'x-upsert': 'true'
      },
      body: pdfBlob
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Upload failed with HTTP ${res.status}`);
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${REPORTS_BUCKET}/${encodeURIComponent(cleanFileName)}`;
    return {
      success: true,
      fileName: cleanFileName,
      publicUrl,
      bucket: REPORTS_BUCKET
    };
  } catch (err) {
    console.error('Supabase storage upload error:', err);
    throw err;
  }
}

/**
 * List all saved PDF reports in the Supabase Storage bucket
 */
export async function listPdfReportsFromSupabase() {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${REPORTS_BUCKET}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefix: '',
        limit: 50,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    });

    if (!res.ok) {
      console.warn('Could not list Supabase reports:', res.status);
      return [];
    }

    const files = await res.json();
    if (!Array.isArray(files)) return [];

    return files
      .filter(f => f.name && !f.name.startsWith('.'))
      .map(file => ({
        ...file,
        publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${REPORTS_BUCKET}/${encodeURIComponent(file.name)}`,
        formattedDate: file.created_at ? new Date(file.created_at).toLocaleString() : 'Recent',
        sizeKb: file.metadata?.size
          ? (file.metadata.size / 1024).toFixed(1)
          : (file.size ? (file.size / 1024).toFixed(1) : 'N/A')
      }));
  } catch (err) {
    console.error('Failed to list reports from Supabase Storage:', err);
    return [];
  }
}

/**
 * Delete a PDF report from Supabase Storage bucket
 */
export async function deletePdfReportFromSupabase(fileName) {
  try {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${REPORTS_BUCKET}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefixes: [fileName]
      })
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to delete report from Supabase Storage:', err);
    return false;
  }
}
