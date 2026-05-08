# BBSW Email Management

A Google Apps Script tool for managing email subscriber lists and batch sending campaigns with partition-based rate limiting.

## Features

- **Email List Management**: Subscribe/unsubscribe tracking with automatic deduplication
- **Partitioned Sending**: Distribute emails evenly across partitions to avoid hitting Gmail sending limits
- **Flexible Body Formats**: Support for plain text (auto-converted to HTML), raw HTML, or rich text editing
- **Attachments**: Attach files from Google Drive, public URLs, or upload directly from the sidebar
- **Bounce Auditing**: Automatically detect and remove bounced email addresses from your list
- **Legacy Import**: Import subscriber lists from CSV files with automatic timestamping
- **Re-send Scheduling**: Schedule campaigns to re-send after a configurable delay (default: 7 days)

## Setup

### 1. Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **+ Blank** to create a new spreadsheet
3. You can name the spreadsheet anything you like, except that the tool expects a sheet tab named **"Email List"**.

### 2. Access Apps Script

1. In the Google Sheet, click **Extensions** in the top menu
2. Select **Apps Script**
   - A new tab will open with the Apps Script editor
   - You'll see a default `Code.gs` file

### 3. Create Project Files

1. **Delete the default `Code.gs`**: Click the trash icon next to it
2. **Create `Shared.gs`**:
   - Click the **+** button next to "Files"
   - Select **Create new file**
   - Name it `Shared.gs` and click **Create**
   - Copy the entire contents of `Shared.gs` from this repository and paste it
3. **Create `Admin.gs`**:
   - Click the **+** button again
   - Name it `Admin.gs` and click **Create**
   - Copy and paste the contents of `Admin.gs`
4. **Create `Bootstrap.gs`**:
   - Click the **+** button again
   - Name it `Bootstrap.gs` and click **Create**
   - Copy and paste the contents of `Bootstrap.gs`

### 4. Update Configuration

1. In the Apps Script editor, click the **Project Settings** icon (gear icon) on the left sidebar
2. Under **Show advanced settings**, enable **Show "appsscript.json" manifest file in editor**
3. Click on `appsscript.json` in the file list (it should now be visible)
4. Copy the contents from the `appsscript.json` file in this repository and paste it into your project file, replacing the existing content
5. Click **Save**

### 5. Authorize the Script

1. Click **Run** at the top of the editor
2. A pop-up will appear asking for permissions
3. Select your Google account
4. Click **Allow** to grant Gmail and Drive access
5. After authorization completes, close the Apps Script tab

### 6. Create the Email List Sheet

1. In your Google Sheet, click the **+** button at the bottom to add a new sheet
2. Name it **"Email List"** (this name is required by the tool)
3. Add these column headers in row 1:
   - A1: `Timestamp`
   - B1: `First Name`
   - C1: `Last Name`
   - D1: `Affiliation`
   - E1: `Role`
   - F1: `Email Address`
   - G1: `Subscribe or Unsubscribe`
   - H1: `Partition` (optional—created automatically by "Assign/Refresh Partitions")

### 7. Customize Sender Display Name

By default, emails are sent with the display name "BBSW". To change this to your name or organization:

1. In the Apps Script editor, open `appsscript/Admin.gs`
2. Find line 391: `name: 'BBSW'`
3. Replace `'BBSW'` with your preferred name (e.g., `'John Smith'` or `'BBSW Communications'`)
4. Click **Save**
5. Refresh your Google Sheet

The next time you send an email, it will appear from your custom display name. Recipients will see "from: [Your Name] <your-email@gmail.com>" instead of "from: BBSW <your-email@gmail.com>".

### 8. Refresh and Verify

1. **Refresh the page** (or go back to your Google Sheet tab)
2. You should now see the **Admin Tools** menu at the top
3. You're ready to use all admin functions!

## Usage

All features are accessible via the **Admin Tools** menu that appears when you open the spreadsheet.

### Sending Campaigns

#### Send now (Sidebar)

Opens an interactive sidebar to compose and send emails. This is the main interface for campaigns.

![Admin Sidebar](Sidebar.png)

##### Step 1: Choose Recipients

**Send to** — Select who receives this email:
- **All subscribers** — Sends to all currently subscribed emails (default)
- **Partition 0, 1, 2, ...** — Sends only to a specific partition. Use this to split large campaigns across multiple sendings to avoid hitting Gmail's rate limits.

##### Step 2: Compose Subject

**Subject** — Email subject line. You can use placeholders like `{{First Name}}` to personalize:
- Example: `Welcome {{First Name}} — BBSW Update`
- Placeholders are replaced with each recipient's data from the Email List

##### Step 3: Choose Body Format

**Body mode** — Controls how your email body is formatted and edited:

- **Plain Text (auto-convert to HTML)** — Best for simple text emails. You type plain text; the script automatically converts it to HTML. Line breaks become paragraphs, multiple line breaks create space. Good for most emails.
  
- **HTML Textarea** — For advanced users. You write raw HTML directly. The script sends it as-is without modifications. Use this if you need fine-grained control over formatting, `<table>` layouts, or custom styling.
  
- **Rich Text Editor (WYSIWYG)** — Visual editor with toolbar. Click the formatting buttons (B, I, U) to bold/italicize/underline selected text. Use the Size and Font dropdowns to change font size and family. Best if you're not comfortable with HTML.

##### Step 4: Format Body Content

Enter your email body in the text area (Plain/HTML) or editor (Rich mode).

**Personalization** — Use these placeholders in the body too:
- `{{First Name}}`
- `{{Last Name}}`
- `{{Affiliation}}`
- `{{Role}}`
- `{{Email Address}}`

Example (Plain Text mode):
```
Hi {{First Name}},

Thank you for subscribing to BBSW updates. Your affiliation is {{Affiliation}} and your role is {{Role}}.

Best regards,
The Team
```

Each recipient sees their own data substituted in place of the placeholders.

##### Adding Images to Email Body (Rich Text Editor Only)

Images can only be embedded in **Rich Text Editor** mode. There are two ways to insert images:

**Option 1: Paste from Clipboard**
1. Copy an image to your clipboard (take a screenshot, right-click an image in your browser and select "Copy image", or copy an image file from Finder)
2. Click into the Rich Text Editor area
3. Press **⌘V** (Mac) or **Ctrl+V** (Windows/Linux)
4. The image will be inserted into the editor

**Option 2: Drag and Drop**
1. Drag an image file from Finder directly into the Rich Text Editor area
2. Or, drag an image from another browser tab into the editor
3. The image will be inserted

##### Step 5: Add Attachments (Optional)

**Attachments (Drive IDs / URLs, comma or newline separated)** — Attach files to the email:

- **Google Drive files** — Paste the file URL: `https://drive.google.com/file/d/1abc123XYZ/view?usp=sharing` or just the file ID
- **Public URLs** — Paste any public link: `https://example.com/document.pdf`
- **Upload files** — Use the "Upload files" input below to pick files directly from your computer (this sending only; not saved)

Examples:
```
https://drive.google.com/file/d/1abc123XYZ/view
1abc123XYZ
https://example.com/flyer.pdf
```

##### Step 6: Send or Save

- **Clean + Dedup + Send** — Removes duplicate emails, then sends the campaign to all selected recipients. Failed sends are logged and removed from the list. Bounce audit runs automatically afterward.
  
- **Save inputs** — Stores the subject, body, body mode, and attachments for later. Useful if you want to tweak formatting or use the same email again.

#### Send now (use saved inputs)

Sends using previously saved subject, body, and attachments without opening the sidebar. Useful for quick re-sends without re-entering data.

#### Schedule Re-Send in 1 Week

Creates a time-based trigger to automatically re-send the last campaign (same subject, body, attachments, partition filter) after 7 days. The trigger runs in the background; check the Apps Script log (Extensions > Apps Script > Logs) to see when it executed.

### Managing Subscribers

**Clean + Deduplicate (Global)** — Removes duplicate email entries, keeping only the latest subscription status for each email.

**Assign/Refresh Partitions** — Evenly distributes subscribers across N partitions (default: 4) using deterministic hashing. Guarantees partition sizes differ by at most 1 row.

**Set Partition Count** — Adjust the number of partitions (1–26) and re-run Assign/Refresh Partitions to apply.

**Import Legacy CSV (from Drive)** — Import subscriber lists from a CSV file with columns: First Name, Last Name, Email Address, Affiliation, Role. Each import gets a distinct legacy timestamp for tracking.

**Import Unsubscribe List** — Remove subscribers by pasting email addresses (one per line or comma-separated) or uploading a CSV with an "Email" or "Email Address" column.

**Audit Bounces (Global)** — Scans Gmail for bounce messages from mailer-daemon. Dry-run mode previews bounces without deletion; normal mode removes matching emails from the list.

**Remove All Re-Send Triggers** — Cancels all scheduled re-send campaigns.

## Email Template Placeholders

In subject and body, use these placeholders to personalize messages:

- `{{First Name}}`
- `{{Last Name}}`
- `{{Affiliation}}`
- `{{Role}}`
- `{{Email Address}}`

## Configuration

All settings are in `CONFIG` (Shared.gs):

- `SHEET_NAME` — Name of the subscriber list sheet (default: "Email List")
- `RESEND_DELAY_DAYS` — Days to wait before re-send trigger fires (default: 7)
- `BOUNCE_LOOKBACK_DAYS` — Look back N days in Gmail for bounce messages (default: 3)
- `LOG_SHEET_NAME` — Name of the bounce audit log sheet (default: "Bounce Audit Log")
- `LEGACY_BASE_ISO` — Base date for legacy imports (default: 2000-01-01)

## How Partitions Work

Partitions enable sending to large lists without hitting Gmail's rate limits. To send to 1000 subscribers:

1. Set partition count to 4
2. Each partition receives ~250 emails
3. Send to partition 0, wait, send to partition 1, etc.

## Scripts

- **Bootstrap.gs** — Entry point; defines the Admin Tools menu
- **Admin.gs** — All admin functions: sending, importing, auditing, partitioning
- **Shared.gs** — Configuration and shared utilities: HTML escaping, template rendering, attachment building, sheet operations

## Logs

- All errors and activity are logged to the Apps Script log (View > Logs)
- Bounce audits are also recorded in the "Bounce Audit Log" sheet with timestamp, query, and results
