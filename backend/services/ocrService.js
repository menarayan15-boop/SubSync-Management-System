import fs from 'fs';
import { createRequire } from 'module';
import Tesseract from 'tesseract.js';
import TrackedSubscription from '../models/TrackedSubscription.js';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

// Known services with their provider and category mappings
const KNOWN_SERVICES = [
  { name: 'Netflix', provider: 'Netflix Inc.', category: 'Entertainment', keywords: ['netflix'] },
  { name: 'Spotify Premium', provider: 'Spotify AB', category: 'Entertainment', keywords: ['spotify'] },
  { name: 'Amazon Prime', provider: 'Amazon', category: 'Entertainment', keywords: ['amazon prime', 'prime video', 'amazon.in/prime'] },
  { name: 'Disney+ Hotstar', provider: 'Novi Digital / Disney', category: 'Entertainment', keywords: ['hotstar', 'disney+'] },
  { name: 'YouTube Premium', provider: 'Google LLC', category: 'Entertainment', keywords: ['youtube premium', 'youtube music', 'google youtube'] },
  { name: 'ChatGPT Plus', provider: 'OpenAI', category: 'Productivity', keywords: ['chatgpt', 'openai'] },
  { name: 'Adobe Creative Cloud', provider: 'Adobe Systems', category: 'Design & Creativity', keywords: ['adobe', 'creative cloud', 'photoshop', 'illustrator'] },
  { name: 'GitHub Pro', provider: 'GitHub Inc. / Microsoft', category: 'Cloud & Dev', keywords: ['github', 'github pro', 'github team', 'github copilot'] },
  { name: 'Google One', provider: 'Google LLC', category: 'Cloud & Dev', keywords: ['google one', 'google storage', 'google workspace'] },
  { name: 'Microsoft 365', provider: 'Microsoft Corp.', category: 'Productivity', keywords: ['microsoft 365', 'office 365', 'microsoft'] },
  { name: 'Notion', provider: 'Notion Labs', category: 'Productivity', keywords: ['notion', 'notion plus'] },
  { name: 'Canva Pro', provider: 'Canva Pty Ltd', category: 'Design & Creativity', keywords: ['canva', 'canva pro'] },
  { name: 'Figma Professional', provider: 'Figma Inc.', category: 'Design & Creativity', keywords: ['figma', 'figjam'] },
  { name: 'Dropbox', provider: 'Dropbox Inc.', category: 'Cloud & Dev', keywords: ['dropbox', 'dropbox plus'] },
  { name: 'Coursera Plus', provider: 'Coursera Inc.', category: 'Education', keywords: ['coursera', 'coursera plus'] },
  { name: 'Duolingo Super', provider: 'Duolingo Inc.', category: 'Education', keywords: ['duolingo', 'super duolingo'] },
  { name: 'SubSync Membership', provider: 'SubSync Inc.', category: 'Productivity', keywords: ['subsync'] },
  { name: 'Slack Pro', provider: 'Slack Technologies / Salesforce', category: 'Productivity', keywords: ['slack'] },
  { name: 'Zoom Pro', provider: 'Zoom Video Communications', category: 'Productivity', keywords: ['zoom.us', 'zoom video'] },
  { name: 'LinkedIn Premium', provider: 'LinkedIn / Microsoft', category: 'Business', keywords: ['linkedin', 'linkedin learning', 'sales navigator'] },
  { name: 'Vercel Pro', provider: 'Vercel Inc.', category: 'Cloud & Dev', keywords: ['vercel'] },
  { name: 'AWS Cloud', provider: 'Amazon Web Services', category: 'Cloud & Dev', keywords: ['aws', 'amazon web services'] },
];

/**
 * Extracts raw textual content from uploaded PDF or Image file
 */
export const extractTextFromFile = async (filePath, mimeType) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  if (mimeType === 'application/pdf') {
    try {
      const dataBuffer = await fs.promises.readFile(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      await parser.load();
      const parsed = await parser.getText();
      const text = parsed?.text || '';
      await parser.destroy();
      return text;
    } catch (pdfErr) {
      console.error('[OCR Service] PDF parsing error:', pdfErr.message);
      throw new Error(`PDF Extraction failed: ${pdfErr.message}`);
    }
  }

  if (mimeType.startsWith('image/')) {
    try {
      const result = await Tesseract.recognize(filePath, 'eng', {
        errorHandler: (err) => console.error('[OCR Service] Tesseract warning:', err),
      });
      return result?.data?.text || '';
    } catch (imgErr) {
      console.error('[OCR Service] Image OCR error:', imgErr.message);
      throw new Error(`Image OCR Extraction failed: ${imgErr.message}`);
    }
  }

  throw new Error(`Unsupported file MIME type for OCR: ${mimeType}`);
};

/**
 * Semantic parser to extract subscription attributes from raw text
 */
export const parseSubscriptionText = (rawText) => {
  const text = (rawText || '').trim();
  const lowerText = text.toLowerCase();

  let serviceName = '';
  let providerName = '';
  let category = 'Other';
  let amount = 0;
  let currency = 'INR';
  let billingFrequency = 'monthly';
  let purchaseDate = null;
  let nextRenewalDate = null;
  let invoiceReference = '';
  let subscriptionStatus = 'Active';
  let confidenceScore = 10; // Base score for having readable text

  // 1. Identify Service & Provider
  for (const svc of KNOWN_SERVICES) {
    if (svc.keywords.some((kw) => lowerText.includes(kw))) {
      serviceName = svc.name;
      providerName = svc.provider;
      category = svc.category;
      confidenceScore += 30;
      break;
    }
  }

  // Fallback: If no known service found, detect title from "Subscription for / to / Bill from"
  if (!serviceName) {
    const serviceMatch = text.match(/(?:subscription\s+(?:to|for)|service|plan|billed\s+by|merchant)\s*[:\-]?\s*([A-Za-z0-9\s&]{2,30})/i);
    if (serviceMatch && serviceMatch[1]) {
      serviceName = serviceMatch[1].trim();
      providerName = serviceName;
      confidenceScore += 15;
    } else {
      // Pick first non-empty prominent line
      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2 && l.length < 40);
      if (lines.length > 0) {
        serviceName = lines[0].slice(0, 35);
        providerName = serviceName;
        confidenceScore += 10;
      }
    }
  }

  // 2. Identify Currency
  if (lowerText.includes('₹') || lowerText.includes('inr') || lowerText.includes('rs.') || lowerText.includes('rs ')) {
    currency = 'INR';
    confidenceScore += 10;
  } else if (lowerText.includes('$') || lowerText.includes('usd')) {
    currency = 'USD';
    confidenceScore += 10;
  } else if (lowerText.includes('€') || lowerText.includes('eur')) {
    currency = 'EUR';
    confidenceScore += 10;
  }

  // 3. Identify Amount
  // Pattern 1: Target labeled amounts (Total, Amount Paid, Net Amount, Grand Total, Price)
  const labeledAmountMatch = text.match(/(?:total(?:\s+amount)?|amount\s+paid|net\s+paid|grand\s+total|charge(?:d)?|price|fee)\s*[:\-]?\s*(?:₹|Rs\.?|INR|\$|USD|€|EUR)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
  if (labeledAmountMatch && labeledAmountMatch[1]) {
    amount = parseFloat(labeledAmountMatch[1].replace(/,/g, ''));
    confidenceScore += 30;
  } else {
    // Pattern 2: Any currency symbol followed by numbers
    const symbolAmountMatch = text.match(/(?:₹|Rs\.?|\$|€)\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    if (symbolAmountMatch && symbolAmountMatch[1]) {
      amount = parseFloat(symbolAmountMatch[1]);
      confidenceScore += 20;
    } else {
      // Pattern 3: Look for numbers with decimal e.g. 199.00 or 649
      const genericAmountMatch = text.match(/\b([0-9]{2,5}(?:\.[0-9]{2})?)\b/);
      if (genericAmountMatch && genericAmountMatch[1]) {
        amount = parseFloat(genericAmountMatch[1]);
        confidenceScore += 10;
      }
    }
  }

  // 4. Identify Billing Frequency
  if (lowerText.includes('year') || lowerText.includes('annual') || lowerText.includes('/yr') || lowerText.includes('per annum')) {
    billingFrequency = 'yearly';
    confidenceScore += 10;
  } else if (lowerText.includes('quarter') || lowerText.includes('/qtr')) {
    billingFrequency = 'quarterly';
    confidenceScore += 10;
  } else if (lowerText.includes('week') || lowerText.includes('/wk')) {
    billingFrequency = 'weekly';
    confidenceScore += 10;
  } else if (lowerText.includes('one-time') || lowerText.includes('lifetime')) {
    billingFrequency = 'one-time';
  } else {
    billingFrequency = 'monthly'; // default subscription frequency
    confidenceScore += 5;
  }

  // 5. Identify Dates
  // Patterns for date e.g. 15/10/2026, 2026-10-15, 15 Oct 2026, October 15, 2026
  const dateRegex = /\b(?:(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})|(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})|(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})[\s,]+(\d{4}))\b/i;

  const invoiceDateMatch = text.match(new RegExp(`(?:invoice\\s+date|date|billed\\s+on|purchased\\s+on|transaction\\s+date)\\s*[:\\-]?\\s*(${dateRegex.source})`, 'i'));
  if (invoiceDateMatch) {
    const rawDateStr = invoiceDateMatch[1];
    const parsed = new Date(rawDateStr);
    if (!isNaN(parsed.getTime())) {
      purchaseDate = parsed;
      confidenceScore += 10;
    }
  }

  if (!purchaseDate) {
    const genericDateMatch = text.match(dateRegex);
    if (genericDateMatch) {
      const parsed = new Date(genericDateMatch[0]);
      if (!isNaN(parsed.getTime())) {
        purchaseDate = parsed;
      }
    }
  }

  if (!purchaseDate) {
    purchaseDate = new Date(); // Fallback to current date
  }

  // Look for next renewal / expiry date
  const renewalMatch = text.match(new RegExp(`(?:next\\s+billing|next\\s+renewal|renews\\s+on|valid\\s+until|expiry\\s+date|due\\s+date)\\s*[:\\-]?\\s*(${dateRegex.source})`, 'i'));
  if (renewalMatch) {
    const parsedRenewal = new Date(renewalMatch[1]);
    if (!isNaN(parsedRenewal.getTime())) {
      nextRenewalDate = parsedRenewal;
      confidenceScore += 10;
    }
  }

  // If no explicit renewal date found, project from purchaseDate + billingFrequency
  if (!nextRenewalDate) {
    nextRenewalDate = new Date(purchaseDate);
    if (billingFrequency === 'monthly') {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 1);
    } else if (billingFrequency === 'yearly') {
      nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);
    } else if (billingFrequency === 'quarterly') {
      nextRenewalDate.setMonth(nextRenewalDate.getMonth() + 3);
    } else if (billingFrequency === 'weekly') {
      nextRenewalDate.setDate(nextRenewalDate.getDate() + 7);
    }
  }

  // 6. Invoice Reference
  const refMatch = text.match(/(?:invoice|bill|transaction|order|ref(?:erence)?)\s*(?:no|num|number|id|#)?\s*[:#\-]?\s*([A-Za-z0-9\-]{4,30})/i);
  if (refMatch && refMatch[1]) {
    invoiceReference = refMatch[1].trim();
    confidenceScore += 5;
  }

  // 7. Status
  if (lowerText.includes('paid') || lowerText.includes('successful') || lowerText.includes('completed')) {
    subscriptionStatus = 'Active';
  } else if (lowerText.includes('pending') || lowerText.includes('unpaid')) {
    subscriptionStatus = 'Pending';
  }

  // Cap confidence score
  confidenceScore = Math.min(98, Math.max(25, confidenceScore));

  return {
    serviceName: serviceName || 'Scanned Subscription',
    providerName: providerName || serviceName || 'Unknown Provider',
    category,
    amount: isNaN(amount) ? 0 : amount,
    currency,
    billingFrequency,
    purchaseDate,
    nextRenewalDate,
    invoiceReference,
    subscriptionStatus,
    confidenceScore,
    rawText: text.slice(0, 4000), // save first 4000 chars of extracted text
  };
};

/**
 * Duplicate detection against user's existing tracked subscriptions
 */
export const detectDuplicateSubscription = async (userId, extractedData) => {
  const { serviceName, providerName, amount, billingFrequency } = extractedData;
  const existingSubs = await TrackedSubscription.find({ user: userId, status: { $ne: 'Cancelled' } });

  const cleanName = (serviceName || '').toLowerCase().trim();
  const cleanProvider = (providerName || '').toLowerCase().trim();

  for (const sub of existingSubs) {
    const subName = (sub.name || '').toLowerCase().trim();
    const subProvider = (sub.provider || '').toLowerCase().trim();

    // Check direct name match
    const nameMatch =
      cleanName &&
      (subName === cleanName || subName.includes(cleanName) || cleanName.includes(subName));

    // Check provider match
    const providerMatch =
      cleanProvider &&
      (subProvider === cleanProvider || subProvider.includes(cleanProvider) || cleanProvider.includes(subProvider));

    // Check amount match
    const amountMatch = Math.abs(sub.amount - (amount || 0)) <= 10;
    const cycleMatch = sub.billingCycle === billingFrequency;

    if (nameMatch || (providerMatch && amountMatch) || (providerMatch && cycleMatch)) {
      return {
        isDuplicate: true,
        matchedSubscription: {
          id: sub._id,
          name: sub.name,
          provider: sub.provider,
          amount: sub.amount,
          billingCycle: sub.billingCycle,
          nextRenewalDate: sub.nextRenewalDate,
          status: sub.status,
        },
        duplicateReason: nameMatch
          ? `You already have an active subscription named "${sub.name}".`
          : `Matches existing provider "${sub.provider}" with similar amount (₹${sub.amount}).`,
      };
    }
  }

  return {
    isDuplicate: false,
    matchedSubscription: null,
    duplicateReason: '',
  };
};

