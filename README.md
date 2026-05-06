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

1. Click on `appsscript.json` (you may need to click **Show more** → **Project settings**)
2. Copy the contents from the `appsscript.json` file in this repository and update your project file
3. Click **Save**

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

### 7. Refresh and Verify

1. **Refresh the page** (or go back to your Google Sheet tab)
2. You should now see the **Admin Tools** menu at the top
3. You're ready to use all admin functions!

## Usage

All features are accessible via the **Admin Tools** menu that appears when you open the spreadsheet.

### Sending Campaigns

**Send now (Sidebar)** — Opens an interactive sidebar to:
- Select partition filter (all subscribers or a specific partition)
- Compose subject and body with template placeholders
- Choose body format: plain text, HTML, or rich text editor
- Add attachments from Drive, URLs, or upload files
- Save inputs for re-use

**Send now (use saved inputs)** — Sends using previously saved subject, body, and attachments without opening the sidebar.

**Schedule Re-Send in 1 Week** — Creates a time-based trigger to automatically re-send the last campaign in 7 days.

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
