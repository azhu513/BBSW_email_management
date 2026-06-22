# Configuration and Internals

Reference for project files, configuration keys, and logs.

## File layout

| File | Purpose |
|---|---|
| `appsscript/Bootstrap.gs` | Entry point; defines the **Admin Tools** menu via `onOpen()`. |
| `appsscript/Admin.gs` | All admin functions: sending, importing, auditing, partitioning. |
| `appsscript/Shared.gs` | `CONFIG` object and shared utilities: header validation, normalization, template rendering, HTML escaping, partition hashing, Drive ID extraction, attachment building, sheet row removal. |
| `appsscript/appsscript.json` | Apps Script manifest (OAuth scopes, runtime settings). |

## Configuration (`CONFIG` in `Shared.gs`)

All settings are constants in the `CONFIG` object at the top of `Shared.gs`.

| Key | Default | Description |
|---|---|---|
| `SHEET_NAME` | `'Email List'` | Name of the subscriber list sheet tab. |
| `EXCLUDE_SHEET_NAME` | `'Exclude in Send'` | Optional sheet tab listing email addresses to skip during sends. See [Follow-up Campaigns](follow-up-campaigns.md). |
| `RESEND_DELAY_DAYS` | `7` | Days to wait before the scheduled re-send trigger fires. |
| `PROP_PARTITION_COUNT` | `'PARTITION_COUNT'` | Script Property key holding the current partition count. |
| `PROP_SUBJECT` | `'SUBJECT'` | Script Property key for the saved subject. |
| `PROP_BODY` | `'BODY'` | Script Property key for the saved body. |
| `PROP_BODY_MODE` | `'BODY_MODE'` | `'AUTO'`, `'HTML'`, or `'RICH'`. |
| `PROP_ATTACH_INPUTS` | `'ATTACH_INPUTS'` | Script Property key for the saved attachment list (Drive IDs and URLs). |
| `PROP_PARTITION_FILTER` | `'PARTITION_FILTER'` | `'ALL'` or a partition index as a string (`'0'`, `'1'`, …). |
| `BOUNCE_LOOKBACK_DAYS` | `3` | How many days back to search Gmail for bounce messages. |
| `LOG_SHEET_NAME` | `'Bounce Audit Log'` | Name of the bounce audit log sheet (auto-created on first audit). |
| `LEGACY_BASE_ISO` | `'2000-01-01T00:00:00Z'` | Base date for the legacy import backdate sequence. |
| `PROP_LEGACY_OFFSET_DAYS` | `'LEGACY_OFFSET_DAYS'` | Script Property key holding the current legacy import offset. |

## Required sheet structure

The **Email List** sheet must have these column headers in row 1, in order:

| Col | Header |
|---|---|
| A | `Timestamp` |
| B | `First Name` |
| C | `Last Name` |
| D | `Affiliation` |
| E | `Role` |
| F | `Email Address` |
| G | `Subscribe or Unsubscribe` |
| H | `Partition` (auto-created by **Assign/Refresh Partitions**) |

The script validates these headers at the start of every operation and throws an error if they don't match exactly.

## Logs and audit trail

- **All errors and activity** are logged to the Apps Script execution log:
  Extensions → Apps Script → **Executions** (left sidebar)
- **Bounce audits** are also recorded in the **"Bounce Audit Log"** sheet, with one row per audit run containing: Timestamp, Query, Dry Run flag, Found Count, Removed Count, and the comma-separated list of emails.

## Script Properties (visible to advanced users)

The tool persists state via `PropertiesService.getScriptProperties()`. To inspect or reset:

1. Extensions → Apps Script → **Project Settings** (gear icon)
2. Scroll to **Script Properties**
3. You'll see entries for the saved subject/body/mode, the partition count, the partition filter, and the legacy offset.

Resetting these is safe — the next time you open the sidebar, defaults will be reapplied.
