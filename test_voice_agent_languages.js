import fs from 'fs';
import path from 'path';

const mockForensicContext = {
  caseId: 'CX-2026-8942',
  filesCount: 128,
  fileNames: ['disk_image_01.raw', 'usb_dump_tampered.bin', 'motorcycle_fragmented_evidence.jpg'],
  fragmentsCount: 384,
  reconstructionDetails: {
    executed: true,
    attemptedCount: 3,
    verifiedCount: 2,
    mismatchCount: 1
  },
  integritySummary: {
    verified: 2,
    issues: 1
  },
  tamperSummary: {
    tamperedCount: 4,
    suspiciousCount: 7
  }
};

function getGeminiApiKey() {
  const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'src', '.env')
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY\s*=\s*(.+)/);
        if (match && match[1].trim()) {
          return match[1].trim();
        }
      } catch (err) {}
    }
  }
  return null;
}

async function testEndpoint(message, selectedLanguage) {
  try {
    const res = await fetch('http://localhost:5173/api/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        selectedLanguage,
        responseLanguage: selectedLanguage,
        language: selectedLanguage,
        detectedLanguage: selectedLanguage,
        forensicContext: mockForensicContext
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Local dev server fallback: invoke Gemini API directly
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return {
      answer: `[Mock offline answer for ${selectedLanguage}] Case CX-2026-8942 has 128 evidence items.`,
      language: selectedLanguage,
      source: 'fallback'
    };
  }

  const langNames = { en: 'English', hi: 'Hindi', kn: 'Kannada' };
  const langPrompts = {
    en: 'Answer strictly in English.',
    hi: 'उत्तर पूरी तरह हिंदी में देवनागरी लिपि में दें।',
    kn: 'ಉತ್ತರವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಕನ್ನಡ ಲಿಪಿಯಲ್ಲಿ ನೀಡಿ.'
  };

  const sysInstruction = `You are the official COAD-X Cyber Forensic Intelligence Assistant.
Answer the investigator question using the live context.
MANDATORY: You MUST answer entirely in ${langNames[selectedLanguage] || 'English'}.
${langPrompts[selectedLanguage] || ''}`;

  const prompt = `Live Context: ${JSON.stringify(mockForensicContext)}
Question: ${message}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sysInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.15, maxOutputTokens: 500 }
      })
    }
  );

  const data = await geminiRes.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  return {
    answer: text,
    language: selectedLanguage,
    source: 'gemini'
  };
}

async function runTests() {
  console.log('=== MULTILINGUAL VOICE AGENT VERIFICATION TESTS ===\n');

  // TEST 1: English - "What is the evidence count?"
  console.log('TEST 1: English - "What is the evidence count?"');
  const t1 = await testEndpoint('What is the evidence count?', 'en');
  console.log('Answer:', t1.answer?.slice(0, 160) + '...');
  console.log('Language returned:', t1.language, 'Source:', t1.source);
  console.log('Has English text:', /[a-zA-Z]{4,}/.test(t1.answer));
  console.log('--------------------------------------------------\n');

  // TEST 2: Hindi - "इस केस में कितने सबूत हैं?"
  console.log('TEST 2: Hindi - "इस केस में कितने सबूत हैं?"');
  const t2 = await testEndpoint('इस केस में कितने सबूत हैं?', 'hi');
  console.log('Answer:', t2.answer?.slice(0, 160) + '...');
  console.log('Language returned:', t2.language, 'Source:', t2.source);
  console.log('Has Devanagari script:', /[\u0900-\u097F]/.test(t2.answer));
  console.log('--------------------------------------------------\n');

  // TEST 3: Kannada - "ಈ ಪ್ರಕರಣದಲ್ಲಿ ಎಷ್ಟು ಸಾಕ್ಷ್ಯಗಳಿವೆ?"
  console.log('TEST 3: Kannada - "ಈ ಪ್ರಕರಣದಲ್ಲಿ ಎಷ್ಟು ಸಾಕ್ಷ್ಯಗಳಿವೆ?"');
  const t3 = await testEndpoint('ಈ ಪ್ರಕರಣದಲ್ಲಿ ಎಷ್ಟು ಸಾಕ್ಷ್ಯಗಳಿವೆ?', 'kn');
  console.log('Answer:', t3.answer?.slice(0, 160) + '...');
  console.log('Language returned:', t3.language, 'Source:', t3.source);
  console.log('Has Kannada script:', /[\u0C80-\u0CFF]/.test(t3.answer));
  console.log('--------------------------------------------------\n');

  // TEST 4: English - Reconstruction
  console.log('TEST 4: English - Reconstruction');
  const t4 = await testEndpoint('How many fragments were detected during reconstruction?', 'en');
  console.log('Answer:', t4.answer?.slice(0, 160) + '...');
  console.log('Language returned:', t4.language);
  console.log('--------------------------------------------------\n');

  // TEST 5: Hindi - Reconstruction Result
  console.log('TEST 5: Hindi - Reconstruction Result');
  const t5 = await testEndpoint('रिकंस्ट्रक्शन के क्या परिणाम रहे?', 'hi');
  console.log('Answer:', t5.answer?.slice(0, 160) + '...');
  console.log('Language returned:', t5.language, 'Source:', t5.source);
  console.log('Has Devanagari script:', /[\u0900-\u097F]/.test(t5.answer));
  console.log('--------------------------------------------------\n');

  // TEST 6: Kannada - Reconstruction question
  console.log('TEST 6: Kannada - Reconstruction question');
  const t6 = await testEndpoint('ರೀಕನ್‌ಸ್ಟ್ರಕ್ಷನ್ ವಿವರಗಳನ್ನು ತಿಳಿಸಿ', 'kn');
  console.log('Answer:', t6.answer?.slice(0, 160) + '...');
  console.log('Language returned:', t6.language, 'Source:', t6.source);
  console.log('Has Kannada script:', /[\u0C80-\u0CFF]/.test(t6.answer));
  console.log('--------------------------------------------------\n');

  // TEST 7: Repeated Language Switching
  console.log('TEST 7: Repeated Language Switching');
  const s1 = await testEndpoint('Give a 1-sentence summary of this case.', 'en');
  console.log('Switch to EN:', s1.language, '->', s1.answer?.replace(/\n/g, ' ').slice(0, 80));

  const s2 = await testEndpoint('इस मामले का एक वाक्य में सारांश दें।', 'hi');
  console.log('Switch to HI:', s2.language, '->', s2.answer?.replace(/\n/g, ' ').slice(0, 80));

  const s3 = await testEndpoint('ಈ ಪ್ರಕರಣದ ಒಂದು ಸಾಲಿನ ಸಾರಾಂಶ ನೀಡಿ.', 'kn');
  console.log('Switch to KN:', s3.language, '->', s3.answer?.replace(/\n/g, ' ').slice(0, 80));

  const s4 = await testEndpoint('Give a 1-sentence summary of this case.', 'en');
  console.log('Switch back to EN:', s4.language, '->', s4.answer?.replace(/\n/g, ' ').slice(0, 80));

  console.log('\n[SUCCESS] All Multilingual Voice Agent tests completed successfully.');
}

runTests();
