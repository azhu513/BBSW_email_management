/*
 * BBSW Email Management
 * Copyright (C) 2026 <Anqi Zhu>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details: https://www.gnu.org/licenses/gpl-3.0.html
 */

/***** CONFIGURATION (ADMIN) *****/
const CONFIG = {
  SHEET_NAME: 'Email List',
  RESEND_DELAY_DAYS: 7,

  // Script Properties keys
  PROP_PARTITION_COUNT:    'PARTITION_COUNT',
  PROP_SUBJECT:            'SUBJECT',
  PROP_BODY:               'BODY',
  PROP_BODY_MODE:          'BODY_MODE',       // 'AUTO' | 'HTML' | 'RICH'
  PROP_ATTACH_INPUTS:      'ATTACH_INPUTS',
  PROP_PARTITION_FILTER:   'PARTITION_FILTER', // 'ALL' or '0','1',...

  // Bounce audit
  BOUNCE_LOOKBACK_DAYS: 3,
  LOG_SHEET_NAME: 'Bounce Audit Log',

  // Legacy import
  LEGACY_BASE_ISO: '2000-01-01T00:00:00Z',
  PROP_LEGACY_OFFSET_DAYS: 'LEGACY_OFFSET_DAYS'
};

/***** SAFE UI ALERT *****/
function uiAlert_(msg) {
  try { SpreadsheetApp.getUi().alert(String(msg)); } catch (e) { Logger.log(String(msg)); }
}

/***** HEADER VALIDATION *****/
function validateHeaders_(headers) {
  const expected = [
    'Timestamp', 'First Name', 'Last Name', 'Affiliation',
    'Role', 'Email Address', 'Subscribe or Unsubscribe'
  ];
  const got = headers.map(h => (h || '').toString().trim());
  for (let i = 0; i < expected.length; i++) {
    if (got[i] !== expected[i])
      throw new Error(`Header mismatch at column ${i + 1}. Expected "${expected[i]}", got "${got[i]}".`);
  }
}

/***** NORMALIZATION *****/
function normalizeTimestamp_(v) {
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function normalizeStatus_(v) {
  const s = (v || '').toString().trim().toLowerCase();
  if (s === 'subscribe' || s === 'subscribed') return 'subscribe';
  if (s === 'unsubscribe' || s === 'unsubscribed') return 'unsubscribe';
  return 'unsubscribe';
}

function safeString_(val) {
  return (val == null) ? '' : String(val);
}

/***** PARTITIONING *****/
function emailHash_(email) {
  const s = (email || '').toLowerCase().trim();
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
  return h;
}

function getPartitionCount_() {
  const val = PropertiesService.getScriptProperties().getProperty(CONFIG.PROP_PARTITION_COUNT);
  const n = parseInt(val || '4', 10);
  return (isNaN(n) || n < 1) ? 4 : n;
}

/***** TEMPLATE RENDERING *****/
function renderTemplate_(tpl, payload) {
  return tpl.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, k) => payload[k] || '');
}

function stripHtml_(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function autoConvertTextToHtml_(text) {
  const s = String(text || '');
  const looksLikeHtml =
    /<\s*(p|br|div|span|h[1-6]|table|ul|ol|img|a)\b/i.test(s) ||
    /<\/[a-z]+>/i.test(s);
  if (looksLikeHtml) return s;

  const lines = s.split(/\r?\n/);
  const paras = [];
  let buf = [];
  for (const line of lines) {
    if (line.trim() === '') {
      if (buf.length) { paras.push(`<p>${buf.join('<br>')}</p>`); buf = []; }
    } else {
      buf.push(escapeHtmlText_(line));
    }
  }
  if (buf.length) paras.push(`<p>${buf.join('<br>')}</p>`);
  return paras.join('\n');
}

function escapeHtmlText_(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/***** GOOGLE LINK / DRIVE ID EXTRACTION *****/
function extractGoogleIdFlexible_(text) {
  if (!text) return '';
  const s = text.trim();
  const m1 = s.match(/drive\/folders\/([A-Za-z0-9_-]+)/);  if (m1) return m1[1];
  const m2 = s.match(/file\/d\/([A-Za-z0-9_-]+)/);         if (m2) return m2[1];
  const m3 = s.match(/[?&]id=([A-Za-z0-9_-]+)/);           if (m3) return m3[1];
  const mD = s.match(/docs\.google\.com\/document\/d\/([A-Za-z0-9_-]+)/);     if (mD) return mD[1];
  const mS = s.match(/docs\.google\.com\/spreadsheets\/d\/([A-Za-z0-9_-]+)/); if (mS) return mS[1];
  const mP = s.match(/docs\.google\.com\/presentation\/d\/([A-Za-z0-9_-]+)/); if (mP) return mP[1];
  if (/^[A-Za-z0-9_-]{10,}$/.test(s) && s.indexOf('://') === -1) return s;
  return '';
}

/***** SHEET OPERATIONS *****/
function removeEmailsFromSheet_(emails) {
  if (!emails || !emails.length) return 0;
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found.`);
  const vals = sh.getDataRange().getValues();
  if (vals.length < 2) return 0;

  const set = new Set(emails.map(e => (e || '').toLowerCase().trim()).filter(Boolean));
  const rows = [];
  for (let r = 1; r < vals.length; r++) {
    const em = (vals[r][5] || '').toString().trim().toLowerCase();
    if (set.has(em)) rows.push(r + 1);
  }
  rows.sort((a, b) => b - a).forEach(idx => sh.deleteRow(idx));
  return rows.length;
}

/***** ATTACHMENT BUILDERS (with Drive + URL + upload support) *****/
function splitAttachInputs_(mixed) {
  if (!mixed) return { driveIds: [], urls: [] };
  const tokens = String(mixed).split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
  const driveIds = [];
  const urls = [];
  tokens.forEach(tok => {
    const id = extractGoogleIdFlexible_(tok);
    if (id) driveIds.push(id);
    else if (/^https?:\/\//i.test(tok)) urls.push(tok);
  });
  return { driveIds, urls };
}

function buildAttachments_(driveIds, urls, uploads) {
  const blobs = [];

  // Drive files (admin scope)
  (driveIds || []).forEach(id => {
    try {
      blobs.push(DriveApp.getFileById(id).getBlob());
    } catch (e) { Logger.log(`Drive attach error (${id}): ${e.message}`); }
  });

  // Public URLs
  (urls || []).forEach(u => {
    try {
      const resp = UrlFetchApp.fetch(u, { muteHttpExceptions: true, followRedirects: true });
      if (resp.getResponseCode() >= 200 && resp.getResponseCode() < 300) {
        const blob = resp.getBlob();
        blob.setName(u.split('?')[0].split('#')[0].split('/').pop() || 'attachment');
        blobs.push(blob);
      }
    } catch (e) { Logger.log(`URL attach error (${u}): ${e.message}`); }
  });

  // Base64 uploads from sidebar
  (uploads || []).forEach(up => {
    try {
      const bytes = Utilities.base64Decode(up.base64 || '');
      blobs.push(Utilities.newBlob(bytes, up.mimeType || 'application/octet-stream', up.name || 'upload'));
    } catch (e) { Logger.log(`Upload error: ${e.message}`); }
  });

  return blobs;
}
