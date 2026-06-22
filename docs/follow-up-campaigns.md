# Follow-up Campaigns (Excluding People Who Already Responded)

A common workflow: a team sends an initial campaign, then sends one or more
follow-ups — but each follow-up should skip people who already replied.

This tool supports that workflow via a dedicated sheet tab called
**"Exclude in Send"**. Any email address listed in that tab is skipped on
every send, automatically, without modifying the main "Email List" sheet.

## How it works

- Before each send, the tool reads the **"Exclude in Send"** tab once.
- During the send loop, any subscriber whose email appears in that tab is
  silently skipped.
- The skip count is reported in the post-send alert
  (e.g. *"Sent 82 email(s). (Excluded 12 address(es) via 'Exclude in Send' tab.)"*).
- The main **"Email List"** sheet is not touched. Excluded subscribers
  remain on the list and will be considered again the next time you send.

## Setting up the "Exclude in Send" tab

1. In the spreadsheet, click the **+** button at the bottom to add a new sheet.
2. Name it exactly **"Exclude in Send"** (case-sensitive).
3. Add the same column headers in row 1 as the **"Email List"** tab:
   - A1: `Timestamp`
   - B1: `First Name`
   - C1: `Last Name`
   - D1: `Affiliation`
   - E1: `Role`
   - F1: `Email Address`
   - G1: `Subscribe or Unsubscribe`

   Only column F (**Email Address**) is read by the tool — the other columns
   are there so you can paste rows directly from the Email List tab without
   reformatting. They are useful for your own bookkeeping (when the person
   responded, who they are, etc.) but the tool does not look at them.

4. (Optional) Tint the tab a different color so it's visually distinct from
   "Email List".

If the tab is missing or empty, sends proceed normally — no exclusions.
You can add or remove the tab at any time; nothing else in the tool depends
on it.

## Typical follow-up workflow

Suppose you have 470 subscribers and you're running a 3-round campaign with
roughly a week between rounds.

### Round 1: Initial send

1. Compose your campaign in **Admin Tools → Send now (Sidebar)** and Send.
2. After sending, check your Gmail Inbox for replies.

### Between rounds: Record who responded

For each person who replied:

1. Find their row in the **"Email List"** tab.
2. Copy that row.
3. Paste it into the **"Exclude in Send"** tab.

You can do this one row at a time, or in batch — copy multiple rows at
once if you have many replies. The simplest mental model: *"who do I not
want to email next time? Put their row here."*

> 💡 **Tip:** To find replies efficiently, search Gmail for the campaign's
> subject line (e.g. `subject:"BBSW Update — February"`). Look at the
> conversation threads where someone replied, and copy those addresses
> into the Exclude tab.

### Round 2: Follow-up send

1. Compose the follow-up email in **Send now (Sidebar)** (or use **Send now
   (use saved inputs)** if the body is similar to round 1).
2. Send. The tool reads the **"Exclude in Send"** tab automatically and
   skips everyone listed there.
3. The post-send alert confirms how many addresses were skipped.

### Round 3 and beyond

Repeat between-round step: append newly responded people to the Exclude
tab. Send. The exclude list naturally grows over time without any extra
configuration.

## Resetting the exclusions

When you start a brand-new campaign and want everyone to receive it again:

- **Option A — clear the tab:** Select all rows below the header and delete
  them. The tab stays but has no entries.
- **Option B — delete the tab:** Right-click the **"Exclude in Send"** tab
  and choose Delete. The tool falls back to "no exclusions" until the tab
  is recreated.
- **Option C — keep it as a permanent "do not email" list:** if some
  people should be permanently skipped (e.g. they asked to opt out of
  follow-ups but not unsubscribe entirely), leave them in the tab forever.

There is no built-in archive, so if you might want the old responder list
later, copy the tab to a new sheet (or download as CSV) before clearing.

## How this interacts with other features

| Feature | Interaction |
|---|---|
| **Partitions** | Partitions are computed from the full Email List and are not affected by exclusions. If you exclude 12 people in partition 0, partition 0's send for that round simply has 12 fewer recipients. The same people remain in partition 0 for future sends. |
| **Clean + Deduplicate** | Only operates on the "Email List" tab. It will not modify or read the "Exclude in Send" tab. |
| **Import Unsubscribe List** | Different concept. Unsubscribe permanently removes people from the Email List. Use **"Exclude in Send"** for temporary exclusions (responders to a single campaign); use **Import Unsubscribe List** for people who genuinely opted out. |
| **Audit Bounces** | Operates only on the "Email List" tab. Will not touch the Exclude tab. |
| **Scheduled Re-Send** | When the scheduled re-send fires, it reads the **current** contents of the Exclude tab. If you've added responders since the original send, they will be skipped in the re-send. |
| **Multi-sender workflow** | All senders read from the same Exclude tab, so coordinating exclusions across a team is automatic — one person updates the tab, everyone else benefits. |

## When NOT to use the Exclude tab

- If someone has truly unsubscribed and should never receive any future
  campaign, use **Import Unsubscribe List** instead. Putting them in the
  Exclude tab works for a while, but if the tab is later cleared or
  deleted, they'd receive future emails.
- If a Gmail address consistently bounces, use **Audit Bounces (Global)**
  to remove it from the Email List entirely.

---

**Next:** [Sending Campaigns](sending-campaigns.md) · [Managing Subscribers](managing-subscribers.md)
