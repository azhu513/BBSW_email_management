# Partitions and Gmail Quotas

Partitions split your list into evenly-sized buckets so you can send to large lists without hitting Gmail's daily quota. Partition assignment is deterministic — the same email always lands in the same partition unless you change the partition count.

## Gmail quota reference

| Account type | Apps Script daily quota |
|---|---|
| Consumer Gmail (`@gmail.com`) | **100 recipients/day** |
| Google Workspace | **1,500 recipients/day** |

Notes:
- This is the Apps Script quota, **not** the Gmail web UI quota (which is higher). The Gmail web/SMTP limit of ~500/day for consumer Gmail does not apply to scripts.
- The script's pre-send check (`MailApp.getRemainingDailyQuota`) will warn you if your intended send count exceeds what's remaining today.
- Quota is a **24-hour rolling window**, not a calendar day. If you sent 100 emails at 3pm yesterday, your quota resets at 3pm today — not at midnight.

## Single-sender workflow

For one sender splitting a large list across multiple days.

**Example: 470 subscribers on consumer Gmail**

1. **Admin Tools → Set Partition Count** → enter `5`.
2. **Admin Tools → Assign/Refresh Partitions** — each partition now has ~94 rows.
3. **Day 1:** Send now (Sidebar) → choose "Partition 0" → Send.
4. **Day 2:** Send now (use saved inputs) and switch the filter to Partition 1 — or open the sidebar again and pick "Partition 1".
5. Repeat for partitions 2, 3, 4 over the following days.

Each day stays well under the 100-recipient quota and avoids the bulk-pattern that can trigger Google's account-level send restrictions.

## Multi-sender workflow

Instead of one person sending across multiple days, the same partition scheme can be split across multiple Gmail accounts so the whole campaign goes out on the same day. Each sender's quota is independent — five people on consumer Gmail can collectively deliver 500 emails in a single day (5 × 100), and five people on Workspace can deliver up to 7,500.

**Steps:**

1. **Owner** — In the shared Google Sheet, run **Set Partition Count** with the number of senders, then **Assign/Refresh Partitions**.
2. **Owner** — Share the spreadsheet with each sender (Editor access). Each sender must also be authorized to run the Apps Script — they will be prompted on their first menu click.
3. **Each sender** — Opens the spreadsheet, goes to **Admin Tools → Send now (Sidebar)**, and:
   - Selects **their assigned partition** (e.g. Alice takes Partition 0, Bob takes Partition 1, etc.).
   - Composes (or pastes) the same subject and body. To keep wording consistent, the owner can send first and click **Save inputs**; other senders can then use **Send now (use saved inputs)** and just change the partition filter.
   - Clicks **Send**. Emails go out from that sender's Gmail account (their address appears in the **From** header).

**Warnings:**

- **From address differs per sender.** Recipients in partition 0 see Alice's address; recipients in partition 1 see Bob's. That's usually fine for outreach but may not be desirable for a transactional or branded campaign.
- **Attachments uploaded from one sender's computer are not visible to others.** Use Google Drive file IDs or public URLs in the **Attachments** field so every sender attaches the same files.
- **Coordinate via the sheet.** All senders edit the same "Email List" — avoid running **Clean + Deduplicate**, **Assign/Refresh Partitions**, or imports while someone else is mid-send, since deleting rows shifts partition assignments.

## Troubleshooting quota issues

### "Sent 100, then 70 failed"

The textbook signature of hitting the consumer Gmail 100/day quota. The first 100 sends succeed; subsequent calls to `GmailApp.sendEmail` throw a quota error.

**The fix:** use partitions to split your list across days, or upgrade to Workspace.

### "I sent 100 on day 1, but on day 2 only 1 email goes through"

This is **not** a normal quota recovery pattern — it's a sign that Google's anti-abuse system has temporarily restricted your account. When a consumer account hits the 100-cap with bulk-mail characteristics, Google can drop the effective quota to near-zero for 24–72 hours (sometimes longer).

**What to do:**

1. Run this in the Apps Script editor to confirm:

   ```js
   function checkQuota() {
     Logger.log('Remaining: ' + MailApp.getRemainingDailyQuota());
   }
   ```

   A healthy fresh-day quota is 100 (consumer) or 1,500 (Workspace). A low number (1, 5, etc.) confirms the restriction.

2. **Stop sending immediately.** Repeated failed attempts during a restriction can extend it.
3. **Wait 48–72 hours** without any sending activity.
4. **Switch to a partitioned workflow** (or multi-sender) so your future sends look organic, not bulk.
5. Consider upgrading to **Google Workspace** if you regularly need to send 400+ emails in a single day.

### Reading the actual error message

If a send run fails, the sidebar alert shows a high-level summary. The **per-recipient error details** are in the Apps Script Executions log:

1. **Extensions → Apps Script → Executions** (left sidebar)
2. Click the failing run (most recent `adminHandleSidebarSend` / `adminSendUsingSavedInputs` / `adminResendHandler`)
3. Look for lines like: `Send failure for foo@example.com: <reason>`

Common messages:

| Logged message | Diagnosis |
|---|---|
| `Service invoked too many times for one day: email` | Daily quota exceeded |
| `Limit Exceeded: Email` or `Limit Exceeded: Email Body Size` | Quota or attachment size cap |
| `Invalid email: …` | Malformed address |
| `Authorization is required…` | OAuth token issue; re-authorize the script |

---

**Next:** [Sending Campaigns](sending-campaigns.md) · [Configuration](configuration.md)
