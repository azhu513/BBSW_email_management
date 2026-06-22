# Managing Subscribers

Send actions are intentionally non-destructive — they never modify the "Email List" sheet. Use the menu items below to manage the list itself.

## Recommended pre-send workflow

Before any campaign, run these in order from the **Admin Tools** menu:

1. **Import Unsubscribe List** — if you have new unsubscribe requests to remove.
2. **Clean + Deduplicate (Global)** — collapse duplicates and remove anyone whose latest status is "Unsubscribe".
3. **Assign/Refresh Partitions** — only needed if you added rows; ensures partitions stay balanced.
4. **Audit Bounces (Global)** — optional; clears addresses that bounced from prior campaigns.

Once that's done, open **Send now (Sidebar)** to compose and send.

## Clean + Deduplicate (Global)

Removes duplicate email entries and unsubscribed addresses from the "Email List" sheet.

How it works:
- Groups all rows by email address (case-insensitive).
- For each email, looks at the row with the **latest Timestamp** (column A).
- If that latest row says **Unsubscribe**, every row for that email is deleted.
- If that latest row says **Subscribe**, only the latest row is kept and older duplicates are deleted.

Run this whenever the list has grown — e.g. after importing a CSV, after a Google Form has added new rows, or after manually editing rows. The script reports how many rows were deleted.

## Assign/Refresh Partitions

Evenly distributes subscribers across N partitions (default: 4). Adds or refreshes the **Partition** column (column H). Partition sizes differ by at most 1 row.

When to run:
- After importing new subscribers (Legacy CSV import does this automatically).
- After **Set Partition Count** changes the bucket count.
- If you've manually edited or deleted rows and want to rebalance.

For sizing guidance and quota math, see [Partitions and Quotas](partitions-and-quotas.md).

## Set Partition Count

Prompts for a new partition count between 1 and 26. **Setting the count does not assign partitions** — you must run **Assign/Refresh Partitions** afterward to actually re-bucket the rows.

Tip: divide your list size by your daily quota to get a sensible count. See [Partitions and Quotas](partitions-and-quotas.md).

## Import Legacy CSV (from Drive)

Bulk-imports subscriber rows from a CSV stored on Google Drive. Use this when migrating from another tool or seeding a fresh list.

Required CSV columns (exact order, case-insensitive headers):
1. First Name
2. Last Name
3. Email Address
4. Affiliation
5. Role

Steps:
1. Upload your CSV to Google Drive.
2. Get the file's URL (right-click → "Get link" → "Anyone with the link") or copy its file ID.
3. **Admin Tools → Import Legacy CSV (from Drive)**.
4. Paste the URL or file ID. The script will:
   - Parse the CSV, skipping rows with no email address.
   - Assign each row a synthetic "legacy" timestamp from `LEGACY_BASE_ISO` (default: 2000-01-01), incremented by 1 day per import, capped at yesterday.
   - Mark all rows as **Subscribe**.
   - Run **Clean + Deduplicate** automatically.
   - Run **Assign/Refresh Partitions** automatically.

Why the legacy timestamps? They keep imported rows older than any real subscription activity, so newer Subscribe/Unsubscribe rows always win during dedup.

**Reset Legacy Backdate Sequence** — Resets the offset counter back to 0 so the next import starts again at the base date. Useful if you're re-importing from scratch.

## Import Unsubscribe List

Removes addresses from the list. Two accepted input formats:

- **Pasted addresses** — one per line, or comma/semicolon-separated. Anything containing `@` is treated as an email.
- **Drive CSV** — paste a Google Drive URL or file ID. The CSV must have a column named "Email Address" or "Email" (case-insensitive). If the CSV has only one column, that column is assumed to be emails.

Before deleting, the script shows a confirmation dialog listing the first 20 addresses and asks for YES/NO. Click YES to remove all matching rows from the "Email List" sheet.

## Audit Bounces (Global)

Scans your Gmail inbox for delivery-failure messages from `mailer-daemon` or "Mail Delivery Subsystem" within the last `BOUNCE_LOOKBACK_DAYS` days (default: 3). Extracts the bounced email addresses from the message bodies and (optionally) deletes them from the list.

Two-step prompt:
1. **Dry Run? (YES/NO)** — Type **YES** to preview only (no deletions). Type **NO** to actually delete. Default is YES.
2. **Optional Gmail Label** — Narrow the Gmail search to a specific label (e.g., `label:CampaignBounces`). Leave blank for no filter.

Results are appended to a separate sheet named **"Bounce Audit Log"** with timestamp, query used, dry-run flag, number found, number removed, and the full email list.

Run this every few days after a campaign, or whenever you notice high bounce rates.

## Remove All Re-Send Triggers

Deletes all time-based triggers for `adminResendHandler`. Use this if you scheduled a re-send via **Schedule Re-Send in 1 Week** and want to cancel it before it fires.

---

**Next:** [Partitions and Quotas](partitions-and-quotas.md) · [Sending Campaigns](sending-campaigns.md)
