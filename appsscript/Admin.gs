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

/***** ADMIN: PARTITION MANAGEMENT *****/

function adminSetPartitionCount() {
  const ui = SpreadsheetApp.getUi();
  const current = getPartitionCount_();
  const resp = ui.prompt(
    'Set Partition Count',
    `Current count: ${current}.\nEnter new partition count (1–26):`,
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const n = parseInt(resp.getResponseText(), 10);
  if (isNaN(n) || n < 1 || n > 26) { uiAlert_('Invalid count. Enter 1–26.'); return; }
  PropertiesService.getScriptProperties().setProperty(CONFIG.PROP_PARTITION_COUNT, String(n));
  uiAlert_(`Partition count set to ${n}. Run "Assign/Refresh Partitions" to apply.`);
}

function adminAssignPartitions() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found.`);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) { uiAlert_('No data to partition.'); return; }

  validateHeaders_(values[0]);
  const count = getPartitionCount_();

  const headers = values[0].map(h => (h || '').toString().trim());
  let pIdx = headers.indexOf('Partition');
  if (pIdx === -1) {
    sheet.insertColumnAfter(headers.length);
    pIdx = headers.length;
    sheet.getRange(1, pIdx + 1).setValue('Partition');
  }

  // Collect rows with valid emails, sort by hash for determinism, then round-robin
  const entries = [];
  for (let r = 1; r < values.length; r++) {
    const email = (values[r][5] || '').toString().trim().toLowerCase();
    entries.push({ r, email, hash: email ? emailHash_(email) : -1 });
  }

  const withEmail = entries.filter(e => e.hash >= 0);
  withEmail.sort((a, b) => a.hash - b.hash);

  const partitionByRow = new Map();
  for (let i = 0; i < withEmail.length; i++) {
    partitionByRow.set(withEmail[i].r, i % count);
  }

  const out = entries.map(e => [partitionByRow.has(e.r) ? partitionByRow.get(e.r) : '']);
  sheet.getRange(2, pIdx + 1, out.length, 1).setValues(out);
  uiAlert_(`Partitions (0–${count - 1}) assigned for ${withEmail.length} row(s).`);
}

/***** ADMIN: CLEAN + DEDUPLICATE (GLOBAL) *****/

function adminCleanAndDedup() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found.`);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) { uiAlert_('Nothing to clean.'); return; }

  validateHeaders_(values[0]);

  // Build per-email latest entry map
  const emailInfo = new Map();
  for (let r = 1; r < values.length; r++) {
    const ts = normalizeTimestamp_(values[r][0]);
    const email = (values[r][5] || '').toString().trim().toLowerCase();
    const status = normalizeStatus_(values[r][6]);
    if (!email) continue;
    const entry = emailInfo.get(email);
    if (!entry || ts > entry.latestDate) {
      emailInfo.set(email, { latestRowIdx: r, latestDate: ts, latestStatus: status });
    }
  }

  const unsubs = new Set();
  const subs = new Set();
  emailInfo.forEach((info, email) => {
    if (info.latestStatus === 'unsubscribe') unsubs.add(email);
    else if (info.latestStatus === 'subscribe') subs.add(email);
  });

  const rowsToDelete = [];
  for (let r = 1; r < values.length; r++) {
    const email = (values[r][5] || '').toString().trim().toLowerCase();
    if (!email) continue;
    // Remove all rows for unsubscribed emails
    if (unsubs.has(email)) { rowsToDelete.push(r + 1); continue; }
    // Remove duplicate rows for subscribed emails (keep latest only)
    if (subs.has(email) && (r + 1) !== emailInfo.get(email).latestRowIdx + 1) {
      rowsToDelete.push(r + 1);
    }
  }

  rowsToDelete.sort((a, b) => b - a).forEach(idx => sheet.deleteRow(idx));
  uiAlert_(`Clean + Dedup: deleted ${rowsToDelete.length} row(s).`);
}

/***** ADMIN: SEND SIDEBAR *****/

function adminOpenSendSidebar() {
  const props = PropertiesService.getScriptProperties();
  const defaultSubject = props.getProperty(CONFIG.PROP_SUBJECT) || '';
  const defaultBody    = props.getProperty(CONFIG.PROP_BODY) || '';
  const defaultMode    = props.getProperty(CONFIG.PROP_BODY_MODE) || 'AUTO';
  const defaultAttach  = props.getProperty(CONFIG.PROP_ATTACH_INPUTS) || '';
  const defaultFilter  = props.getProperty(CONFIG.PROP_PARTITION_FILTER) || 'ALL';

  // Build partition filter options
  const partCount = getPartitionCount_();
  let partOptions = `<option value="ALL" ${defaultFilter === 'ALL' ? 'selected' : ''}>All subscribers</option>`;
  for (let i = 0; i < partCount; i++) {
    partOptions += `<option value="${i}" ${defaultFilter === String(i) ? 'selected' : ''}>Partition ${i}</option>`;
  }

  const html = `
    <div style="font-family:Arial,sans-serif; padding:12px;">
      <h2 style="margin-top:0;">Admin: Send now</h2>

      <div style="margin-bottom:8px;">
        <label><strong>Send to</strong></label><br>
        <select id="partitionFilter" style="width:100%;">${partOptions}</select>
      </div>

      <div style="margin-bottom:8px;">
        <label><strong>Subject</strong></label><br>
        <input id="subject" type="text" style="width:100%;"
               value="${escapeHtml_(defaultSubject)}"
               placeholder="Welcome {{First Name}} — Update">
      </div>

      <div style="margin-bottom:8px;">
        <label><strong>Body mode</strong></label><br>
        <select id="bodyMode" style="width:100%;">
          <option value="AUTO" ${defaultMode==='AUTO'?'selected':''}>Plain Text (auto-convert to HTML)</option>
          <option value="HTML" ${defaultMode==='HTML'?'selected':''}>HTML Textarea (use as-is)</option>
          <option value="RICH" ${defaultMode==='RICH'?'selected':''}>Rich Text Editor (WYSIWYG)</option>
        </select>
        <p style="color:#444;margin:6px 0;">
          Placeholders: {{First Name}}, {{Last Name}}, {{Affiliation}}, {{Role}}, {{Email Address}}.
        </p>
      </div>

      <div id="textAreaBox" style="margin-bottom:8px; display:none;">
        <textarea id="bodyText" style="width:100%;height:200px;"
                  placeholder="Type plain text or HTML here...">${escapeHtml_(defaultBody)}</textarea>
      </div>

      <div id="richBox" style="margin-bottom:8px; display:none;">
        <div style="margin-bottom:6px; display:flex; gap:6px; flex-wrap:wrap;">
          <button type="button" onclick="document.execCommand('bold')"><b>B</b></button>
          <button type="button" onclick="document.execCommand('italic')"><i>I</i></button>
          <button type="button" onclick="document.execCommand('underline')"><u>U</u></button>
          <select onchange="applyInlineStyle('font-size',this.value);this.selectedIndex=0;">
            <option value="">Size</option>
            <option value="12px">12</option><option value="14px">14</option>
            <option value="16px">16</option><option value="18px">18</option>
            <option value="20px">20</option><option value="24px">24</option>
          </select>
          <select onchange="applyInlineStyle('font-family',this.value);this.selectedIndex=0;">
            <option value="">Font</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>
        </div>
        <div id="editor" contenteditable="true"
             style="border:1px solid #ccc; padding:8px; min-height:200px; font-family:Arial,sans-serif;">
          ${defaultMode==='RICH' ? defaultBody : ''}
        </div>
        <script>
          function applyInlineStyle(prop,val){
            if(!val) return;
            var sel=window.getSelection();
            if(!sel||sel.rangeCount===0) return;
            var range=sel.getRangeAt(0);
            if(!range||range.collapsed) return;
            var span=document.createElement('span');
            span.style[prop]=val;
            range.surroundContents(span);
          }
        </script>
      </div>

      <div style="margin-bottom:8px;">
        <label><strong>Attachments (Drive IDs / URLs, comma or newline separated)</strong></label>
        <p style="color:#444;margin:6px 0;">
          Examples: Drive file URL, Google Docs URL, public URL, or raw file ID.
        </p>
        <textarea id="attachInputs" style="width:100%;height:80px;"
                  placeholder="Paste links or IDs here...">${escapeHtml_(defaultAttach)}</textarea>
      </div>

      <div style="margin-bottom:8px;">
        <label><strong>Upload files (optional, this send only)</strong></label><br>
        <input id="uploads" type="file" multiple>
      </div>

      <div style="margin-top:12px;">
        <button id="sendBtn" style="padding:8px 12px;">Send</button>
        <button id="saveBtn" style="padding:8px 12px; margin-left:8px;">Save inputs</button>
      </div>

      <p id="status" style="color:#00796b; margin-top:10px;"></p>

      <script>
        function readUploads(){
          var files=Array.from(document.getElementById('uploads').files||[]);
          if(!files.length) return Promise.resolve([]);
          return Promise.all(files.map(function(file){
            return new Promise(function(resolve,reject){
              var fr=new FileReader();
              fr.onload=function(){
                resolve({name:file.name,mimeType:file.type||'application/octet-stream',base64:fr.result.split(',')[1]||''});
              };
              fr.onerror=reject;
              fr.readAsDataURL(file);
            });
          }));
        }
        function getInputs(){
          var mode=document.getElementById('bodyMode').value||'AUTO';
          var body=(mode==='RICH')
            ? (document.getElementById('editor').innerHTML||'')
            : (document.getElementById('bodyText').value||'');
          return {
            subject:         document.getElementById('subject').value||'',
            body:            body,
            bodyMode:        mode,
            attachMixed:     document.getElementById('attachInputs').value||'',
            partitionFilter: document.getElementById('partitionFilter').value||'ALL'
          };
        }
        function toggleEditors(){
          var mode=document.getElementById('bodyMode').value||'AUTO';
          document.getElementById('textAreaBox').style.display=(mode==='RICH')?'none':'block';
          document.getElementById('richBox').style.display=(mode==='RICH')?'block':'none';
        }
        document.getElementById('bodyMode').addEventListener('change', toggleEditors);
        toggleEditors();

        document.getElementById('sendBtn').onclick=function(){
          var data=getInputs();
          document.getElementById('status').textContent='Preparing uploads and sending...';
          readUploads().then(function(uploads){
            data.uploads=uploads;
            google.script.run.withSuccessHandler(function(msg){
              document.getElementById('status').textContent=msg;
            }).withFailureHandler(function(err){
              document.getElementById('status').textContent='Error: '+err.message;
            }).adminHandleSidebarSend(data);
          });
        };
        document.getElementById('saveBtn').onclick=function(){
          var data=getInputs();
          document.getElementById('status').textContent='Saving...';
          google.script.run.withSuccessHandler(function(msg){
            document.getElementById('status').textContent=msg;
          }).withFailureHandler(function(err){
            document.getElementById('status').textContent='Error: '+err.message;
          }).adminSaveSidebarInputs(data);
        };
      </script>
    </div>
  `;
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createHtmlOutput(html).setTitle('Admin: Send now')
  );
}

/***** ADMIN: SIDEBAR HANDLERS *****/

function adminSaveSidebarInputs(data) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(CONFIG.PROP_SUBJECT,          (data.subject || '').trim());
  props.setProperty(CONFIG.PROP_BODY,             (data.body || '').trim());
  props.setProperty(CONFIG.PROP_BODY_MODE,        (data.bodyMode || 'AUTO').toUpperCase());
  props.setProperty(CONFIG.PROP_ATTACH_INPUTS,    (data.attachMixed || '').trim());
  props.setProperty(CONFIG.PROP_PARTITION_FILTER,  (data.partitionFilter || 'ALL').trim());
  return 'Inputs saved.';
}

function adminHandleSidebarSend(data) {
  const subject  = (data.subject || '').trim();
  const body     = (data.body || '').trim();
  const bodyMode = (data.bodyMode || 'AUTO').toUpperCase();
  const attachIn = (data.attachMixed || '').trim();
  const uploads  = Array.isArray(data.uploads) ? data.uploads : [];
  const pFilter  = (data.partitionFilter || 'ALL').trim();

  if (!subject) throw new Error('Subject is required.');
  if (!body)    throw new Error('Body is required.');

  // Save for re-send
  adminSaveSidebarInputs(data);

  // NOTE: The sidebar "Send" button intentionally does NOT run clean/dedup
  // or unsubscribe-removal. Use "Clean + Deduplicate (Global)" or
  // "Import Unsubscribe List" from the Admin Tools menu first if needed.

  // Build attachments (Drive + URLs + uploads)
  const { driveIds, urls } = splitAttachInputs_(attachIn);
  const attachBlobs = buildAttachments_(driveIds, urls, uploads);

  // Send. Sending actions intentionally do NOT remove any rows from the sheet.
  // To clean up bounces/unsubscribes, use "Audit Bounces (Global)" or
  // "Import Unsubscribe List" from the Admin Tools menu.
  adminSendToSubscribed_(subject, body, bodyMode, attachBlobs, pFilter);

  return 'Done: emails sent. No rows were removed from the sheet.';
}

/***** ADMIN: SEND USING SAVED INPUTS *****/

function adminSendUsingSavedInputs() {
  const props = PropertiesService.getScriptProperties();
  const subject  = props.getProperty(CONFIG.PROP_SUBJECT) || '';
  const body     = props.getProperty(CONFIG.PROP_BODY) || '';
  const bodyMode = (props.getProperty(CONFIG.PROP_BODY_MODE) || 'AUTO').toUpperCase();
  const attachIn = props.getProperty(CONFIG.PROP_ATTACH_INPUTS) || '';
  const pFilter  = props.getProperty(CONFIG.PROP_PARTITION_FILTER) || 'ALL';

  if (!subject || !body) {
    uiAlert_('No saved subject/body. Use the Send sidebar first.');
    return;
  }

  // NOTE: This send path intentionally does NOT run clean/dedup.
  // Run "Clean + Deduplicate (Global)" or "Import Unsubscribe List" from
  // the Admin Tools menu beforehand if cleanup is needed.

  const { driveIds, urls } = splitAttachInputs_(attachIn);
  const attachBlobs = buildAttachments_(driveIds, urls, []);

  // Sending actions intentionally do NOT remove any rows from the sheet.
  adminSendToSubscribed_(subject, body, bodyMode, attachBlobs, pFilter);
}

/***** ADMIN: CORE SEND FUNCTION *****/
// partitionFilter: 'ALL' or a number string like '0','1',...

function adminSendToSubscribed_(subjectTpl, bodyInput, bodyMode, attachBlobs, partitionFilter) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found.`);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  validateHeaders_(values[0]);

  const headers = values[0].map(h => (h || '').toString().trim());
  const partIdx = headers.indexOf('Partition');
  const filterByPartition = (partitionFilter !== 'ALL' && partIdx !== -1);

  // Count intended recipients up front so we can check quota
  let intendedCount = 0;
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (normalizeStatus_(row[6]) !== 'subscribe') continue;
    if (filterByPartition && String(row[partIdx]) !== String(partitionFilter)) continue;
    if (!(row[5] || '').toString().trim()) continue;
    intendedCount++;
  }

  // 1) Pre-send quota check
  let remainingQuota;
  try {
    remainingQuota = MailApp.getRemainingDailyQuota();
  } catch (e) {
    remainingQuota = null; // proceed but cannot guard
    Logger.log('Could not read remaining quota: ' + e.message);
  }

  if (remainingQuota === 0) {
    uiAlert_(
      `Gmail daily quota is 0 — cannot send any email today.\n\n` +
      `Try again in 24 hours. Nothing was sent and no rows were modified.`
    );
    return [];
  }

  if (remainingQuota !== null && remainingQuota < intendedCount) {
    const ui = SpreadsheetApp.getUi();
    const resp = ui.alert(
      'Gmail Quota Warning',
      `Remaining Gmail quota today: ${remainingQuota}\n` +
      `Intended recipients: ${intendedCount}\n\n` +
      `If you continue, only the first ${remainingQuota} will be sent and the rest will be skipped. ` +
      `\n\nContinue?`,
      ui.ButtonSet.YES_NO
    );
    if (resp !== ui.Button.YES) {
      uiAlert_('Send cancelled. No emails sent, no rows modified.');
      return [];
    }
  }

  // Regex to recognize quota / account-restriction errors (NOT real bounces)
  const QUOTA_RE = /quota|limit exceeded|too many|service invoked|temporarily|unauthorized|authorization|rate/i;

  let sentCount = 0;
  let quotaHit = false;
  let quotaMessage = '';
  let skippedDueToQuota = 0;
  const failures = [];          // real bad-address failures only — safe to remove

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const status = normalizeStatus_(row[6]);
    if (status !== 'subscribe') continue;

    // Partition filter
    if (filterByPartition && String(row[partIdx]) !== String(partitionFilter)) continue;

    const email = (row[5] || '').toString().trim().toLowerCase();
    if (!email) continue;

    // 4) If quota was already hit, skip remaining rows without attempting/sending
    if (quotaHit) { skippedDueToQuota++; continue; }

    const payload = {
      'First Name':    safeString_(row[1]),
      'Last Name':     safeString_(row[2]),
      'Affiliation':   safeString_(row[3]),
      'Role':          safeString_(row[4]),
      'Email Address': email
    };

    const subj = renderTemplate_(subjectTpl, payload);
    const htmlBody = (bodyMode === 'HTML' || bodyMode === 'RICH')
      ? renderTemplate_(bodyInput, payload)
      : renderTemplate_(autoConvertTextToHtml_(bodyInput), payload);

    try {
      GmailApp.sendEmail(email, subj, stripHtml_(htmlBody), {
        htmlBody: htmlBody,
        attachments: attachBlobs,
        name: 'BBSW'
      });
      sentCount++;
      Utilities.sleep(200);
    } catch (e) {
      const msg = e && e.message ? e.message : String(e);
      Logger.log(`Send failure for ${email}: ${msg}`);

      // 3) Classify: quota/account error vs. real per-address failure
      if (QUOTA_RE.test(msg)) {
        quotaHit = true;
        quotaMessage = msg;
        // Do NOT add this email to `failures` — it is not a bounce.
      } else {
        failures.push(email);
      }
    }
  }

  // Surface a concise summary. Per-recipient error details are written
  // to the Apps Script execution log (Executions tab) via Logger.log above.
  if (quotaHit) {
    uiAlert_(
      `Sending stopped after ${sentCount} email(s) due to a Gmail quota or account restriction.\n\n` +
      `Reason: ${quotaMessage}\n\n` +
      `${skippedDueToQuota} remaining recipient(s) were SKIPPED.\n` +
      `${failures.length} address(es) failed for other reasons.\n\n` +
      `See the Apps Script "Executions" log for per-address error details.`
    );
  } else {
    uiAlert_(
      `Sent ${sentCount} email(s).` +
      (failures.length
        ? `\nFailed: ${failures.length} (see Executions log for details).`
        : '')
    );
  }

  return failures;
}

/***** ADMIN: SCHEDULE RE-SEND *****/

function adminScheduleResend() {
  adminRemoveResendTriggers();
  const ms = CONFIG.RESEND_DELAY_DAYS * 24 * 60 * 60 * 1000;
  ScriptApp.newTrigger('adminResendHandler').timeBased().after(ms).create();
  uiAlert_(`Re-send scheduled in ${CONFIG.RESEND_DELAY_DAYS} day(s).`);
}

function adminResendHandler() {
  const props = PropertiesService.getScriptProperties();
  const subject  = props.getProperty(CONFIG.PROP_SUBJECT) || '';
  const body     = props.getProperty(CONFIG.PROP_BODY) || '';
  const bodyMode = (props.getProperty(CONFIG.PROP_BODY_MODE) || 'AUTO').toUpperCase();
  const attachIn = props.getProperty(CONFIG.PROP_ATTACH_INPUTS) || '';
  const pFilter  = props.getProperty(CONFIG.PROP_PARTITION_FILTER) || 'ALL';

  if (!subject || !body) { Logger.log('Re-send skipped: no saved subject/body.'); return; }

  // NOTE: Scheduled re-send intentionally does NOT run clean/dedup.
  // Run "Clean + Deduplicate (Global)" or "Import Unsubscribe List" from
  // the Admin Tools menu beforehand if cleanup is needed.

  const { driveIds, urls } = splitAttachInputs_(attachIn);
  const attachBlobs = buildAttachments_(driveIds, urls, []);

  // Sending actions intentionally do NOT remove any rows from the sheet.
  adminSendToSubscribed_(subject, body, bodyMode, attachBlobs, pFilter);

  Logger.log('Admin re-send completed. No rows were removed from the sheet.');
}

function adminRemoveResendTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'adminResendHandler') ScriptApp.deleteTrigger(t);
  });
}

/***** ADMIN: IMPORT LEGACY CSV (DISTINCT BACKDATES) *****/

function getNextLegacyBackDate_() {
  const props = PropertiesService.getScriptProperties();
  const base = new Date(CONFIG.LEGACY_BASE_ISO);
  let offsetDays = parseInt(props.getProperty(CONFIG.PROP_LEGACY_OFFSET_DAYS) || '0', 10);
  if (isNaN(offsetDays) || offsetDays < 0) offsetDays = 0;

  const candidate = new Date(base.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  const latestAllowed = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
  const legacyDate = (candidate.getTime() >= latestAllowed.getTime()) ? latestAllowed : candidate;

  props.setProperty(CONFIG.PROP_LEGACY_OFFSET_DAYS, String(offsetDays + 1));
  return legacyDate;
}

function resetLegacyBackdateSequence_() {
  PropertiesService.getScriptProperties().setProperty(CONFIG.PROP_LEGACY_OFFSET_DAYS, '0');
  uiAlert_('Legacy backdate sequence reset.');
}

function adminImportLegacyCsv() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt(
    'Import Legacy CSV',
    'Paste the Google Drive CSV file URL or file ID.\nExpected headers: First Name, Last Name, Email Address, Affiliation, Role',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const fileId = extractGoogleIdFlexible_((resp.getResponseText() || '').trim());
  if (!fileId) { uiAlert_('Could not extract a valid file ID.'); return; }

  try {
    const file = DriveApp.getFileById(fileId);
    let csvText = file.getBlob().getDataAsString();
    if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.substring(1); // strip BOM

    const rows = Utilities.parseCsv(csvText);
    if (!rows || rows.length < 2) { uiAlert_('CSV seems empty.'); return; }

    const header = rows[0].map(h => (h || '').toString().trim().toLowerCase());
    const expected = ['first name', 'last name', 'email address', 'affiliation', 'role'];
    for (let i = 0; i < expected.length; i++) {
      if ((header[i] || '') !== expected[i]) {
        uiAlert_(`Header mismatch at column ${i + 1}. Expected "${expected[i]}", found "${header[i] || ''}".`);
        return;
      }
    }

    const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) throw new Error(`Sheet "${CONFIG.SHEET_NAME}" not found.`);

    const legacyDate = getNextLegacyBackDate_();
    const appendValues = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const email = safeString_(row[2]).trim();
      if (!email) continue;
      appendValues.push([
        legacyDate,
        safeString_(row[0]).trim(), // First Name
        safeString_(row[1]).trim(), // Last Name
        safeString_(row[3]).trim(), // Affiliation
        safeString_(row[4]).trim(), // Role
        email,
        'Subscribe'
      ]);
    }
    if (!appendValues.length) { uiAlert_('No valid rows to import.'); return; }

    sheet.getRange(sheet.getLastRow() + 1, 1, appendValues.length, appendValues[0].length)
      .setValues(appendValues);

    adminCleanAndDedup();
    adminAssignPartitions();

    uiAlert_(`Imported ${appendValues.length} subscriber(s) with legacy date ${legacyDate.toISOString()}, cleaned, and partitioned.`);
  } catch (e) {
    uiAlert_(`Import error: ${e.message}`);
  }
}

/***** ADMIN: IMPORT UNSUBSCRIBE LIST *****/

function adminImportUnsubscribes() {
  const ui = SpreadsheetApp.getUi();
  const resp = ui.prompt(
    'Import Unsubscribe List',
    'Paste email addresses (one per line, or comma-separated)\n' +
    '— OR —\n' +
    'Paste a Google Drive CSV URL / file ID (with an "Email Address" or "Email" column).',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return;

  const input = (resp.getResponseText() || '').trim();
  if (!input) { uiAlert_('No input provided.'); return; }

  let emails = [];

  // Check if the input looks like a Drive URL or file ID
  const fileId = extractGoogleIdFlexible_(input);
  if (fileId && !input.includes('@')) {
    // Treat as Drive CSV
    try {
      const file = DriveApp.getFileById(fileId);
      let csvText = file.getBlob().getDataAsString();
      if (csvText.charCodeAt(0) === 0xFEFF) csvText = csvText.substring(1);

      const rows = Utilities.parseCsv(csvText);
      if (!rows || rows.length < 2) { uiAlert_('CSV seems empty.'); return; }

      // Find the email column (case-insensitive)
      const header = rows[0].map(h => (h || '').toString().trim().toLowerCase());
      let emailCol = header.indexOf('email address');
      if (emailCol === -1) emailCol = header.indexOf('email');
      if (emailCol === -1 && header.length === 1) emailCol = 0; // single-column CSV

      if (emailCol === -1) {
        uiAlert_('Could not find an "Email Address" or "Email" column in the CSV.\n' +
                 'Found headers: ' + rows[0].join(', '));
        return;
      }

      for (let r = 1; r < rows.length; r++) {
        const e = (rows[r][emailCol] || '').toString().trim().toLowerCase();
        if (e && e.includes('@')) emails.push(e);
      }
    } catch (e) {
      uiAlert_('Error reading Drive file: ' + e.message);
      return;
    }
  } else {
    // Treat as pasted list of email addresses
    const tokens = input.split(/[\s,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    tokens.forEach(t => {
      if (t.includes('@')) emails.push(t);
    });
  }

  // Deduplicate
  emails = Array.from(new Set(emails));

  if (!emails.length) {
    uiAlert_('No valid email addresses found in the input.');
    return;
  }

  // Confirm before removing
  const confirmResp = ui.alert(
    'Confirm Unsubscribe Removal',
    `Found ${emails.length} email address(es) to unsubscribe and remove:\n\n` +
    emails.slice(0, 20).join('\n') +
    (emails.length > 20 ? `\n… and ${emails.length - 20} more` : '') +
    '\n\nRemove all matching rows from "Email List"?',
    ui.ButtonSet.YES_NO
  );
  if (confirmResp !== ui.Button.YES) { uiAlert_('Cancelled.'); return; }

  const removed = removeEmailsFromSheet_(emails);
  uiAlert_(`Unsubscribe import complete: removed ${removed} row(s) matching ${emails.length} email address(es).`);
}

/***** ADMIN: BOUNCE AUDIT *****/

function adminAuditBounces() {
  const ui = SpreadsheetApp.getUi();

  const dryResp = ui.prompt(
    'Bounce Audit — Dry Run?',
    'Type YES for dry run (no deletions), or NO to remove bounced emails. Default: YES',
    ui.ButtonSet.OK_CANCEL
  );
  if (dryResp.getSelectedButton() !== ui.Button.OK) return;
  const dryRun = (String(dryResp.getResponseText() || 'YES').trim().toUpperCase() !== 'NO');

  const labelResp = ui.prompt(
    'Optional Gmail Label',
    'Enter a Gmail label to narrow search (e.g., label:CampaignBounces). Leave blank for none.',
    ui.ButtonSet.OK_CANCEL
  );
  if (labelResp.getSelectedButton() !== ui.Button.OK) return;
  const labelFilter = String(labelResp.getResponseText() || '').trim();

  const base = `from:(mailer-daemon OR "Mail Delivery Subsystem") newer_than:${CONFIG.BOUNCE_LOOKBACK_DAYS}d`;
  const query = labelFilter ? `${base} ${labelFilter}` : base;

  const threads = GmailApp.search(query, 0, 300);
  const failedEmails = new Set();

  threads.forEach(thread => {
    thread.getMessages().forEach(msg => {
      const from = (msg.getFrom() || '').toLowerCase();
      if (!/mailer-daemon|mail delivery subsystem/.test(from)) return;
      const body = (msg.getBody() || '') + '\n' + (msg.getPlainBody() || '');
      const re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
      (body.match(re) || []).forEach(e => failedEmails.add(e.trim().toLowerCase()));
    });
  });

  const list = Array.from(failedEmails);
  if (!list.length) { uiAlert_('Bounce audit found no failed addresses.'); return; }

  if (dryRun) {
    logBounceAudit_(query, list, true, 0);
    uiAlert_(`Bounce audit (DRY RUN) found ${list.length} address(es). See "${CONFIG.LOG_SHEET_NAME}".`);
    return;
  }

  const removed = removeEmailsFromSheet_(list);
  logBounceAudit_(query, list, false, removed);
  uiAlert_(`Bounce audit removed ${removed} email(s) from "${CONFIG.SHEET_NAME}".`);
}

/** Silent version used after sends (no UI prompts, always removes) */
function adminAuditBounces_silent_() {
  try {
    const query = `from:(mailer-daemon OR "Mail Delivery Subsystem") newer_than:${CONFIG.BOUNCE_LOOKBACK_DAYS}d`;
    const threads = GmailApp.search(query, 0, 100);
    const failedEmails = new Set();

    threads.forEach(thread => {
      thread.getMessages().forEach(msg => {
        const from = (msg.getFrom() || '').toLowerCase();
        if (!/mailer-daemon|mail delivery subsystem/.test(from)) return;
        const body = (msg.getBody() || '') + '\n' + (msg.getPlainBody() || '');
        const re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
        (body.match(re) || []).forEach(e => failedEmails.add(e.trim().toLowerCase()));
      });
    });

    if (failedEmails.size) {
      const removed = removeEmailsFromSheet_(Array.from(failedEmails));
      Logger.log(`Silent bounce audit removed ${removed} email(s).`);
    }
  } catch (e) {
    Logger.log(`Bounce audit error: ${e.message}`);
  }
}

function logBounceAudit_(query, emails, wasDryRun, removedCount) {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(CONFIG.LOG_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.LOG_SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Query', 'Dry Run', 'Found Count', 'Removed Count', 'Emails']);
  }
  sheet.appendRow([
    new Date(), query, wasDryRun ? 'YES' : 'NO',
    (emails || []).length, removedCount || 0, (emails || []).join(', ')
  ]);
}
